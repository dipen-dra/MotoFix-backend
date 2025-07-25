const Service = require("../../models/Service");
const fs = require('fs');
const path = require('path');

exports.getServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const query = {};
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
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.createService = async (req, res) => {
    const { name, description, price, duration } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Service image is required." });
    }
    if (!name || !price) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Name and price are required." });
    }
    
    try {
        const newService = new Service({
            name,
            description,
            price,
            duration,
            image: req.file.path
        });
        await newService.save();
        res.status(201).json({ success: true, message: "Service created successfully.", data: newService });
    } catch (error) {
        if (req.file) {
           fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Failed to create service", error: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        const { name, description, price, duration } = req.body;
        const updateData = { name, description, price, duration };

        if (req.file) {
            if (service.image && fs.existsSync(service.image)) {
                fs.unlinkSync(service.image);
            }
            updateData.image = req.file.path;
        }

        const updatedService = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: "Service updated successfully.", data: updatedService });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        if (service.image && fs.existsSync(service.image)) {
            fs.unlinkSync(service.image);
        }

        await Service.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.getServiceWithReviews = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user',
                select: 'fullName profilePicture'
            });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        res.status(200).json({ success: true, data: service });

    } catch (error) {
        console.error('Error fetching service with reviews for admin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
