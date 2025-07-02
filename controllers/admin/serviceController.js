const Service = require("../../models/Service");

// Get all services with pagination
exports.getServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Default to 6 for card layout
        const skip = (page - 1) * limit;

        // No search functionality needed for services as per frontend design, but can be added here if needed.
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


// --- UNCHANGED FUNCTIONS ---
exports.createService = async (req, res) => {
    const { name, description, price, duration } = req.body;
    if (!name || !price) {
        return res.status(400).json({ success: false, message: "Name and price are required." });
    }
    try {
        const newService = new Service({ name, description, price, duration });
        await newService.save();
        res.status(201).json({ success: true, message: "Service created successfully.", data: newService });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedService) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }
        res.status(200).json({ success: true, message: "Service updated successfully.", data: updatedService });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }
        res.status(200).json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};