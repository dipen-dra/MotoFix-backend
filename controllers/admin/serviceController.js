// controllers/admin/serviceController.js
const Service = require("../../models/Service");
const fs = require('fs');
const path = require('path');
const Workshop = require('../../models/Workshop'); // Import Workshop model

exports.getServices = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            query.workshop = workshopId;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        
        const totalItems = await Service.countDocuments(query);
        const services = await Service.find(query)
            .populate('workshop', 'workshopName')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.status(200).json({
            success: true,
            data: services,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Admin getServices Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.createService = async (req, res) => {
    const { name, description, price, duration, workshopId } = req.body;
    let targetWorkshopId = null;

    if (req.user.role === 'admin') {
        targetWorkshopId = req.workshopId;
        if (!targetWorkshopId) {
            if (req.file) { fs.unlinkSync(path.join(__dirname, '../../', req.file.path)); }
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }
    } else if (req.user.role === 'superadmin') {
        targetWorkshopId = workshopId;
        if (!targetWorkshopId) {
            if (req.file) { fs.unlinkSync(path.join(__dirname, '../../', req.file.path)); }
            return res.status(400).json({ success: false, message: "Superadmin must provide a workshopId to create a service." });
        }
        const existingWorkshop = await Workshop.findById(targetWorkshopId);
        if (!existingWorkshop) {
            if (req.file) { fs.unlinkSync(path.join(__dirname, '../../', req.file.path)); }
            return res.status(404).json({ success: false, message: "Specified workshop not found." });
        }
    } else {
        if (req.file) { fs.unlinkSync(path.join(__dirname, '../../', req.file.path)); }
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Service image is required." });
    }
    if (!name || !price) {
        fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
        return res.status(400).json({ success: false, message: "Name and price are required." });
    }
    
    try {
        const existingService = await Service.findOne({ name, workshop: targetWorkshopId });
        if (existingService) {
            fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
            return res.status(400).json({ success: false, message: `A service with this name already exists for this workshop.` });
        }

        const newService = new Service({
            name,
            description,
            price,
            duration,
            image: req.file.path,
            workshop: targetWorkshopId
        });
        await newService.save();
        res.status(201).json({ success: true, message: "Service created successfully.", data: newService });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
        }
        console.error("Admin createService Error:", error);
        res.status(500).json({ success: false, message: "Failed to create service", error: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        } else if (req.user.role === 'superadmin') {
            // Superadmin can update any service by ID, no workshop filter in findQuery
        } else {
            if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const service = await Service.findOne(findQuery);
        if (!service) {
            if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
            return res.status(404).json({ success: false, message: "Service not found or not authorized for your role/workshop." });
        }

        const { name, description, price, duration, workshopId } = req.body;
        const updateData = { name, description, price, duration };

        if (req.user.role === 'superadmin' && workshopId && workshopId !== service.workshop.toString()) {
            const newWorkshop = await Workshop.findById(workshopId);
            if (!newWorkshop) {
                if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
                return res.status(404).json({ success: false, message: "New workshop not found." });
            }
            service.workshop = newWorkshop._id;
        }

        if (name && name !== service.name) {
            const checkWorkshopId = service.workshop;
            const existingService = await Service.findOne({ name, workshop: checkWorkshopId });
            if (existingService && !existingService._id.equals(service._id)) {
                if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
                return res.status(400).json({ success: false, message: `A service with this name already exists for this workshop.` });
            }
        }

        if (req.file) {
            if (service.image && fs.existsSync(path.join(__dirname, '../../', service.image))) { // Correct path for unlinkSync
                fs.unlinkSync(path.join(__dirname, '../../', service.image));
            }
            updateData.image = req.file.path;
        }

        Object.assign(service, updateData);
        const updatedService = await service.save();

        res.status(200).json({ success: true, message: "Service updated successfully.", data: updatedService });

    } catch (error) {
        if (req.file) fs.unlinkSync(path.join(__dirname, '../../', req.file.path));
        console.error("Admin updateService Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        }

        const service = await Service.findOne(findQuery);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found or not authorized for your role/workshop." });
        }

        if (service.image && fs.existsSync(path.join(__dirname, '../../', service.image))) { // Correct path for unlinkSync
            fs.unlinkSync(path.join(__dirname, '../../', service.image));
        }

        await Service.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
        console.error("Admin deleteService Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.getServiceWithReviews = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        }

        const service = await Service.findOne(findQuery)
            .populate({
                path: 'reviews.user', 
                select: 'fullName profilePicture' 
            })
            .populate('workshop', 'workshopName');

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found or not authorized for your role/workshop' });
        }

        res.status(200).json({ success: true, data: service });

    } catch (error) {
        console.error('Error fetching service with reviews for admin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};