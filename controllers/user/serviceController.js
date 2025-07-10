const Service = require("../../models/Service");

/**
 * @desc    Get all available services
 * @route   GET /api/user/services
 * @access  Private
 */
exports.getAvailableServices = async (req, res) => {
    try {
        // This function remains the same as it doesn't need populated reviews.
        const services = await Service.find({}).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

/**
 * @desc    Get a single service by its ID with populated review author details
 * @route   GET /api/user/services/:id
 * @access  Private
 */
exports.getServiceById = async (req, res) => {
    try {
        // --- THIS IS THE UPDATED PART ---
        // We find the service by its ID and then use .populate() to get more details.
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user',      // The path to the field we want to populate (the 'user' inside the 'reviews' array).
                select: 'profilePicture'   // We only select the 'profilePicture' field to be efficient and secure.
            });
        // --- END OF UPDATE ---
        
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }
        
        res.status(200).json({
            success: true,
            data: service 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};