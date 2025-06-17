const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const User = require('../../models/User');

/**
 * @desc    Get all bookings for the logged-in user
 * @route   GET /api/user/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id }).sort({ date: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Create a new booking
 * @route   POST /api/user/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
    const { serviceId, bikeModel, date, notes } = req.body;

    if (!serviceId || !bikeModel || !date) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    try {
        const user = await User.findById(req.user.id);
        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        const booking = new Booking({
            customer: user._id,
            customerName: user.fullName,
            serviceType: service.name,
            bikeModel,
            date,
            notes,
            totalCost: service.price,
            status: 'Pending'
        });

        await booking.save();
        res.status(201).json({ success: true, data: booking });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserBookings,
    createBooking
};