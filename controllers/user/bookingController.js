/**
 * @file controllers/user/bookingController.js
 * @description Controller for user-facing booking operations.
 */

import Booking from '../../models/Booking.js';
import Service from '../../models/Service.js';
import User from '../../models/User.js';
import axios from 'axios';
import sendEmail from '../../utils/sendEmail.js'; // Import the email utility

// Helper function to award loyalty points
const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        // In the esewa controller it was random, here it is 10. Making it random for consistency.
        const pointsToAdd = Math.floor(Math.random() * 11) + 10; // 10 to 20 points
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();
        return pointsToAdd;
    }
    return 0;
};

/**
 * @desc      Get all bookings for the logged-in user
 * @route     GET /api/user/bookings
 * @access    Private
 */
export const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc      Create a new booking
 * @route     POST /api/user/bookings
 * @access    Private
 */
export const createBooking = async (req, res) => {
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
 * @desc      Update a booking made by the user
 * @route     PUT /api/user/bookings/:id
 * @access    Private
 */
export const updateUserBooking = async (req, res) => {
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
 * @desc      Delete/Cancel a booking made by the user
 * @route     DELETE /api/user/bookings/:id
 * @access    Private
 */
export const deleteUserBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has been paid for.' });
        
        if (booking.discountApplied) {
            const user = await User.findById(req.user.id);
            if (user) {
                user.loyaltyPoints += 100; // Refund the 100 points
                await user.save();
            }
        }

        await booking.deleteOne();
        
        res.json({ success: true, message: 'Booking cancelled successfully. Any used loyalty points have been refunded.' });

    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


/**
 * @desc      Confirm a booking payment via COD
 * @route     PUT /api/user/bookings/:id/pay
 * @access    Private
 */
export const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;
    if (paymentMethod !== 'COD') return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });

    try {
        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.customer._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

        booking.paymentMethod = 'COD';
        booking.paymentStatus = 'Paid'; // Marked as 'Paid' but payment is on delivery
        booking.isPaid = true; // Set to true to confirm booking in the system
        await booking.save();
        
        const points = await awardLoyaltyPoints(req.user.id);
        
        // --- SEND RESPONSE IMMEDIATELY ---
        res.status(200).json({ success: true, data: booking, message: `Payment confirmed! You've earned ${points} loyalty points.` });

        // --- SEND EMAIL NOTIFICATION FOR COD IN BACKGROUND ---
        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                        <img src="cid:logo" alt="MotoFix Logo" style="width: 150px;"/>
                        <h2 style="color: #2c3e50;">Booking Confirmed!</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${booking.customer.fullName},</p>
                        <p>Your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> has been confirmed.</p>
                        <p>Please pay <strong>Rs. ${booking.finalAmount}</strong> upon service completion.</p>
                        <p>Payment Method: <strong>Cash on Delivery (COD)</strong></p>
                        <p>Thank you for choosing MotoFix!</p>
                    </div>
                    <hr/>
                    <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                </div>
            `;
            const attachments = [{
                filename: 'logo.png',
                path: 'https://i.imgur.com/gQf5jY8.png',
                cid: 'logo'
            }];
            await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml, attachments);
        } catch(emailError) {
            console.error("Error sending COD confirmation email:", emailError);
        }
        // --- END OF EMAIL NOTIFICATION ---

    } catch (error) {
        console.error(error);
        if(!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
};

/**
 * @desc      Verify a Khalti payment
 * @route     POST /api/user/bookings/verify-khalti
 * @access    Private
 */
export const verifyKhaltiPayment = async (req, res) => {
    const { token, amount, booking_id } = req.body;
    if (!token || !amount || !booking_id) return res.status(400).json({ success: false, message: 'Missing payment verification details.' });

    try {
        const khaltiResponse = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            { token, amount }, 
            { headers: { 'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}` } }
        );

        if (khaltiResponse.data && khaltiResponse.data.idx) {
            const booking = await Booking.findById(booking_id).populate('customer', 'fullName email');
            if (!booking) return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

            booking.paymentMethod = 'Khalti';
            booking.paymentStatus = 'Paid';
            booking.isPaid = true;
            await booking.save();
            
            const points = await awardLoyaltyPoints(req.user.id);

            // --- SEND RESPONSE IMMEDIATELY ---
            res.status(200).json({ success: true, message: `Payment successful! You've earned ${points} loyalty points.` });

            // --- SEND EMAIL NOTIFICATION FOR KHALTI IN BACKGROUND ---
            try {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                            <img src="cid:logo" alt="MotoFix Logo" style="width: 150px;"/>
                            <h2 style="color: #2c3e50;">Payment Successful!</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Dear ${booking.customer.fullName},</p>
                            <p>Your payment for booking <strong>#${booking._id}</strong> has been successfully processed.</p>
                            <p>Your appointment for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> is confirmed.</p>
                            <p>Total Amount Paid: <strong>Rs. ${booking.finalAmount}</strong></p>
                            <p>Thank you for choosing MotoFix!</p>
                        </div>
                        <hr/>
                        <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                    </div>
                `;
                const attachments = [{
                    filename: 'logo.png',
                    path: 'https://pplx-res.cloudinary.com/image/upload/v1751135827/gpt4o_images/pdlz3nvtduzpqhnkuova.png',
                    cid: 'logo'
                }];
                await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml, attachments);
            } catch (emailError) {
                console.error("Error sending Khalti success email:", emailError);
            }
            // --- END OF EMAIL NOTIFICATION ---

        } else {
            return res.status(400).json({ success: false, message: 'Khalti payment verification failed.' });
        }
    } catch (error) {
        console.error('Khalti verification error:', error.response ? error.response.data : error.message);
        if(!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error during Khalti verification.' });
        }
    }
};

/**
 * @desc      Apply a loyalty discount to a booking
 * @route     PUT /api/user/bookings/:id/apply-discount
 * @access    Private
 */
export const applyLoyaltyDiscount = async (req, res) => {
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