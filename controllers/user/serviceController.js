const Service = require("../../models/Service");

const getAvailableServices = async (req, res) => {
    try {
        const services = await Service.find({}).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user',
                select: 'profilePicture'
            });
        
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

module.exports = {
    getAvailableServices,
    getServiceById
};