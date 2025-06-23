// const Booking = require('../../models/Booking');
// const Service = require('../../models/Service');
// const User = require('../../models/User');

// /**
//  * @desc    Get all bookings for the logged-in user
//  * @route   GET /api/user/bookings
//  * @access  Private
//  */
// const getUserBookings = async (req, res) => {
//     try {
//         // This query now works because the schema has a 'customer' field.
//         const bookings = await Booking.find({ customer: req.user.id }).sort({ date: -1 });
//         res.json({ success: true, data: bookings });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// /**
//  * @desc    Create a new booking
//  * @route   POST /api/user/bookings
//  * @access  Private
//  */
// const createBooking = async (req, res) => {
//     const { serviceId, bikeModel, date, notes } = req.body;

//     if (!serviceId || !bikeModel || !date) {
//         return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
//     }

//     try {
//         const user = await User.findById(req.user.id);
//         const service = await Service.findById(serviceId);

//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found.' });
//         }
//         if (!service) {
//             return res.status(404).json({ success: false, message: 'Service not found.' });
//         }

//         const booking = new Booking({
//             // This now correctly saves to the 'customer' field in the schema.
//             customer: user._id,
//             customerName: user.fullName,
//             serviceType: service.name,
//             bikeModel,
//             date,
//             notes,
//             totalCost: service.price,
//             status: 'Pending'
//         });

//         await booking.save();
//         res.status(201).json({ success: true, data: booking });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// module.exports = {
//     getUserBookings,
//     createBooking
// };


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
 * @desc    Create a new booking (but doesn't mark as paid)
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

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
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
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false
        });

        await booking.save();
        res.status(201).json({ success: true, data: booking, message: "Booking created. Please complete payment." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Confirm a booking payment
 * @route   PUT /api/user/bookings/:id/pay
 * @access  Private
 */
const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
        return res.status(400).json({ success: false, message: 'Payment method is required.' });
    }

    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this booking.' });
        }

        if (paymentMethod === 'COD') {
            booking.paymentMethod = 'COD';
            booking.paymentStatus = 'Paid'; // Or 'Pending COD Confirmation' if you want another step
            booking.isPaid = true;
        } else if (paymentMethod === 'Khalti') {
            // Since there is no API key, we will return an error as requested.
            return res.status(400).json({ success: false, message: "Khalti payment is under construction. Please select Cash on Delivery." });
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking, message: "Payment confirmed successfully!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserBookings,
    createBooking,
    confirmPayment
};