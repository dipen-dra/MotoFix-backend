// controllers/user/bookingController.js
const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const User = require('../../models/User');
const axios = require('axios');

// Helper function to award loyalty points
const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        const pointsToAdd = 10;
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();
        return pointsToAdd;
    }
    return 0;
};


/**
 * @desc    Get all bookings for the logged-in user, sorted by most recent
 * @route   GET /api/user/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Create a new booking, which will have a pending payment status
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

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
        
        const booking = new Booking({
            customer: user._id,
            customerName: user.fullName,
            serviceType: service.name,
            bikeModel,
            date,
            notes,
            totalCost: service.price,
            finalAmount: service.price, 
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
 * @desc    Update a booking made by the user
 * @route   PUT /api/user/bookings/:id
 * @access  Private
 */
const updateUserBooking = async (req, res) => {
    try {
        const { serviceId, bikeModel, date, notes } = req.body;
        let booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.status !== 'Pending' || booking.isPaid || booking.discountApplied) {
            return res.status(400).json({ success: false, message: `Cannot edit a booking that is already in progress, paid, or has a discount.` });
        }

        if (serviceId) {
            const service = await Service.findById(serviceId);
            if (!service) return res.status(404).json({ success: false, message: 'New service not found.' });
            booking.serviceType = service.name;
            booking.totalCost = service.price;
            booking.finalAmount = service.price;
        }

        booking.bikeModel = bikeModel || booking.bikeModel;
        booking.date = date || booking.date;
        booking.notes = notes !== undefined ? notes : booking.notes;

        await booking.save();
        res.json({ success: true, data: booking, message: 'Booking updated successfully' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

/**
 * @desc    Delete/Cancel a booking made by the user
 * @route   DELETE /api/user/bookings/:id
 * @access  Private
 */
const deleteUserBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has been paid for.' });
        
        // --- NEW LOGIC: Refund points if discount was applied ---
        if (booking.discountApplied) {
            const user = await User.findById(req.user.id);
            if (user) {
                user.loyaltyPoints += 100; // Give back the 100 points
                await user.save();
            }
        }
        // --- END OF NEW LOGIC ---

        await booking.deleteOne();
        
        // --- MODIFIED: Updated success message to be more general ---
        res.json({ success: true, message: 'Booking cancelled successfully. Any used loyalty points have been refunded.' });

    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


/**
 * @desc    Confirm a booking payment via COD
 * @route   PUT /api/user/bookings/:id/pay
 * @access  Private
 */
const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;
    if (paymentMethod !== 'COD') return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });

    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.customer.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

        booking.paymentMethod = 'COD';
        booking.paymentStatus = 'Paid';
        booking.isPaid = true;
        await booking.save();
        
        const points = await awardLoyaltyPoints(req.user.id);
        
        res.status(200).json({ success: true, data: booking, message: `Payment confirmed! You've earned ${points} loyalty points.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Verify a Khalti payment
 * @route   POST /api/user/bookings/verify-khalti
 * @access  Private
 */
const verifyKhaltiPayment = async (req, res) => {
    const { token, amount, booking_id } = req.body;
    if (!token || !amount || !booking_id) return res.status(400).json({ success: false, message: 'Missing payment verification details.' });

    try {
        const khaltiResponse = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            { token, amount }, 
            { headers: { 'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}` } }
        );

        if (khaltiResponse.data && khaltiResponse.data.idx) {
            const booking = await Booking.findById(booking_id);
            if (!booking) return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

            booking.paymentMethod = 'Khalti';
            booking.paymentStatus = 'Paid';
            booking.isPaid = true;
            await booking.save();
            
            const points = await awardLoyaltyPoints(req.user.id);

            return res.status(200).json({ success: true, message: `Payment successful! You've earned ${points} loyalty points.` });
        } else {
            return res.status(400).json({ success: false, message: 'Khalti payment verification failed.' });
        }
    } catch (error) {
        console.error('Khalti verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Server error during Khalti verification.' });
    }
};

/**
 * @desc    Apply a 20% loyalty discount to a booking
 * @route   PUT /api/user/bookings/:id/apply-discount
 * @access  Private
 */
const applyLoyaltyDiscount = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.customer.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Cannot apply discount to a paid booking.' });
        if (booking.discountApplied) return res.status(400).json({ success: false, message: 'Discount has already been applied.' });

        if (user.loyaltyPoints < 100) {
            return res.status(400).json({ success: false, message: 'Not enough loyalty points. You need at least 100.' });
        }

        const discountValue = booking.totalCost * 0.20;
        booking.finalAmount = booking.totalCost - discountValue;
        booking.discountApplied = true;
        booking.discountAmount = discountValue;
        
        user.loyaltyPoints -= 100;
        
        await booking.save();
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: `20% discount applied! Your new total is ${booking.finalAmount}.`,
            data: { booking, loyaltyPoints: user.loyaltyPoints }
        });

    } catch (error) {
        console.error('Error applying discount:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getUserBookings,
    createBooking,
    updateUserBooking,
    deleteUserBooking,
    confirmPayment,
    verifyKhaltiPayment,
    applyLoyaltyDiscount
};