const Service = require("../../models/Service");

/**
 * @desc    Get all available services
 * @route   GET /api/user/services
 * @access  Private
 */
exports.getAvailableServices = async (req, res) => {
    try {
        const services = await Service.find({}).sort({ createdAt: -1 });
        
        // This now matches the structure your frontend expects.
        res.status(200).json({
            success: true,
            data: services // The key is now 'data'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

/**
 * @desc    Get a single service by its ID
 * @route   GET /api/user/services/:id
 * @access  Private
 */
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }
        
        // This also matches the structure your frontend expects.
        res.status(200).json({
            success: true,
            data: service // The key is now 'data'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};