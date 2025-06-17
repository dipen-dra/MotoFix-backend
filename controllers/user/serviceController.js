const Service = require('../../models/Service');

/**
 * @desc    Get all available services
 * @route   GET /api/user/services
 * @access  Private
 */
const getAvailableServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ name: 1 });
        res.json({ success: true, data: services });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getAvailableServices
};