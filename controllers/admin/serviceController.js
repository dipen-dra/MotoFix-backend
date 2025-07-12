const Service = require("../../models/Service");
const fs = require('fs');
const path = require('path');

// Get all services with pagination (MODIFIED: filter by workshop)
exports.getServices = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        
        const query = { workshop: workshopId }; // Filter services by workshop

        const totalItems = await Service.countDocuments(query);
        const services = await Service.find(query)
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

// CREATE a new service with an image and duration (MODIFIED: assign to workshop)
exports.createService = async (req, res) => {
    const { name, description, price, duration } = req.body;
    const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware

    if (!workshopId) {
        // If no workshopId, delete uploaded file immediately
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Service image is required." });
    }
    if (!name || !price) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Name and price are required." });
    }
    
    try {
        // Optional: Check if a service with the same name already exists for this workshop
        const existingService = await Service.findOne({ name, workshop: workshopId });
        if (existingService) {
            fs.unlinkSync(req.file.path); // Delete the uploaded file if service already exists
            return res.status(400).json({ success: false, message: "A service with this name already exists for your workshop." });
        }

        const newService = new Service({
            name,
            description,
            price,
            duration,
            image: req.file.path,
            workshop: workshopId // Assign service to the admin's workshop
        });
        await newService.save();
        res.status(201).json({ success: true, message: "Service created successfully.", data: newService });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Admin createService Error:", error);
        res.status(500).json({ success: false, message: "Failed to create service", error: error.message });
    }
};

// UPDATE a service, with optional new image and duration (MODIFIED: filter by workshop)
exports.updateService = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        // Find service by ID and ensure it belongs to the current workshop
        const service = await Service.findOne({ _id: req.params.id, workshop: workshopId });
        if (!service) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Service not found or not for your workshop." });
        }

        const { name, description, price, duration } = req.body;
        const updateData = { name, description, price, duration };

        // Optional: Check for duplicate name for this workshop during update
        if (name && name !== service.name) {
            const existingService = await Service.findOne({ name, workshop: workshopId });
            if (existingService && !existingService._id.equals(service._id)) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: "Another service with this name already exists for your workshop." });
            }
        }

        if (req.file) {
            if (service.image && fs.existsSync(service.image)) {
                fs.unlinkSync(service.image);
            }
            updateData.image = req.file.path;
        }

        // Using findByIdAndUpdate directly on the found service, which implicitly handles ID.
        Object.assign(service, updateData); // Merge updateData into the found service object
        const updatedService = await service.save(); // Save to trigger validators and pre/post hooks if any

        res.status(200).json({ success: true, message: "Service updated successfully.", data: updatedService });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error("Admin updateService Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// DELETE a service and its associated image (MODIFIED: filter by workshop)
exports.deleteService = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        // Find service by ID and ensure it belongs to the current workshop
        const service = await Service.findOne({ _id: req.params.id, workshop: workshopId });
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found or not for your workshop." });
        }

        if (service.image && fs.existsSync(service.image)) {
            fs.unlinkSync(service.image);
        }

        await Service.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
        console.error("Admin deleteService Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// @desc    Get a single service with all its reviews populated with user details. (MODIFIED: filter by workshop)
// @route   GET /api/admin/services/:id/reviews
// @access  Private (Admin)
exports.getServiceWithReviews = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        const service = await Service.findOne({ _id: req.params.id, workshop: workshopId })
            .populate({
                path: 'reviews.user', 
                select: 'fullName profilePicture' 
            });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found or not for your workshop' });
        }

        res.status(200).json({ success: true, data: service });

    } catch (error) {
        console.error('Error fetching service with reviews for admin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};