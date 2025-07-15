/**
 * @file controllers/user/bookingController.js
 * @description Controller for user-facing booking operations.
 */

const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const User = require('../../models/User');
const Workshop = require('../../models/Workshop');
const axios = require('axios');
const sendEmail = require('../../utils/sendEmail');

const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg';
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXnMC_iDsPK_BXQ=';

const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        const pointsToAdd = Math.floor(Math.random() * 11) + 10;
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();
        return pointsToAdd;
    }
    return 0;
};

const calculateDistance = (coord1, coord2) => {
    return parseFloat((Math.random() * (20 - 1) + 1).toFixed(2));
};

const getUserBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 11;
        const skip = (page - 1) * limit;

        const query = { customer: req.user.id };

        const totalItems = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
            
        res.json({
            success: true,
            data: bookings,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getUserBookingById = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized.' });
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id, paymentStatus: 'Pending', status: { $ne: 'Cancelled' } }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getBookingHistory = async (req, res) => {
    try {
        const query = { customer: req.user.id, paymentStatus: 'Paid' };

        const bookings = await Booking.find(query).sort({ createdAt: -1 });
            
        res.json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createBooking = async (req, res) => {
    const { 
        serviceId, 
        bikeModel, 
        date, 
        notes, 
        requestedPickupDropoff, 
        pickupAddress, 
        dropoffAddress, 
        pickupCoordinates, 
        dropoffCoordinates 
    } = req.body;

    if (!serviceId || !bikeModel || !date) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields (Service, Bike Model, Date).' });
    }

    try {
        const user = await User.findById(req.user.id);
        const service = await Service.findById(serviceId);
        const workshop = await Workshop.findOne();

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
        if (!workshop) return res.status(500).json({ success: false, message: 'Workshop profile not found. Cannot create booking.' });

        let pickupDropoffDistance = 0;
        let pickupDropoffCost = 0;
        let finalAmount = service.price;

        if (requestedPickupDropoff && workshop.offerPickupDropoff) {
            if (!pickupAddress || !dropoffAddress || !pickupCoordinates || !dropoffCoordinates) {
                return res.status(400).json({ success: false, message: 'Pickup/Dropoff details are incomplete.' });
            }
            pickupDropoffDistance = calculateDistance(pickupCoordinates, dropoffCoordinates);
            pickupDropoffCost = pickupDropoffDistance * workshop.pickupDropoffChargePerKm;
            finalAmount += pickupDropoffCost;
        } else if (requestedPickupDropoff && !workshop.offerPickupDropoff) {
            return res.status(400).json({ success: false, message: 'Pickup and Dropoff service is not offered by the workshop.' });
        }
        
        const booking = new Booking({
            customer: user._id,
            customerName: user.fullName,
            serviceType: service.name,
            service: serviceId,
            bikeModel,
            date,
            notes,
            totalCost: service.price,
            finalAmount: finalAmount,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
            requestedPickupDropoff: requestedPickupDropoff || false,
            pickupAddress: requestedPickupDropoff ? pickupAddress : '',
            dropoffAddress: requestedPickupDropoff ? dropoffAddress : '',
            pickupCoordinates: requestedPickupDropoff ? pickupCoordinates : undefined,
            dropoffCoordinates: requestedPickupDropoff ? dropoffCoordinates : undefined,
            pickupDropoffDistance: requestedPickupDropoff ? pickupDropoffDistance : 0,
            pickupDropoffCost: requestedPickupDropoff ? pickupDropoffCost : 0
        });

        await booking.save();
        res.status(201).json({ success: true, data: booking, message: "Booking created. Please complete payment." });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateUserBooking = async (req, res) => {
    try {
        const { 
            serviceId, 
            bikeModel, 
            date, 
            notes, 
            requestedPickupDropoff, 
            pickupAddress, 
            dropoffAddress,
            pickupCoordinates,
            dropoffCoordinates
        } = req.body;
        let booking = await Booking.findById(req.params.id);
        const workshop = await Workshop.findOne();

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.status !== 'Pending' || booking.isPaid || booking.discountApplied) {
            return res.status(400).json({ success: false, message: `Cannot edit a booking that is already in progress, paid, or has a discount.` });
        }
        if (!workshop) return res.status(500).json({ success: false, message: 'Workshop profile not found. Cannot update booking.' });

        let newTotalCost = booking.totalCost;
        let newPickupDropoffCost = 0;
        let newPickupDropoffDistance = 0;

        if (serviceId && booking.service.toString() !== serviceId) {
            const service = await Service.findById(serviceId);
            if (!service) return res.status(404).json({ success: false, message: 'New service not found.' });
            booking.serviceType = service.name;
            newTotalCost = service.price;
            booking.service = serviceId; 
        }

        if (requestedPickupDropoff !== undefined) {
            booking.requestedPickupDropoff = requestedPickupDropoff;
            if (requestedPickupDropoff && workshop.offerPickupDropoff) {
                if (!pickupAddress || !dropoffAddress || !pickupCoordinates || !dropoffCoordinates) {
                    return res.status(400).json({ success: false, message: 'Pickup/Dropoff details are incomplete for requested service.' });
                }
                newPickupDropoffDistance = calculateDistance(pickupCoordinates, dropoffCoordinates);
                newPickupDropoffCost = newPickupDropoffDistance * workshop.pickupDropoffChargePerKm;
                
                booking.pickupAddress = pickupAddress;
                booking.dropoffAddress = dropoffAddress;
                booking.pickupCoordinates = pickupCoordinates;
                booking.dropoffCoordinates = dropoffCoordinates;
                booking.pickupDropoffDistance = newPickupDropoffDistance;

            } else if (requestedPickupDropoff && !workshop.offerPickupDropoff) {
                return res.status(400).json({ success: false, message: 'Pickup and Dropoff service is not offered by the workshop.' });
            } else {
                booking.pickupAddress = '';
                booking.dropoffAddress = '';
                booking.pickupCoordinates = undefined;
                booking.dropoffCoordinates = undefined;
                booking.pickupDropoffDistance = 0;
                newPickupDropoffCost = 0;
            }
            booking.pickupDropoffCost = newPickupDropoffCost;
        } else {
             if (booking.requestedPickupDropoff && workshop.offerPickupDropoff) {
                let recalculate = false;
                if (pickupAddress && booking.pickupAddress !== pickupAddress) { booking.pickupAddress = pickupAddress; recalculate = true; }
                if (dropoffAddress && booking.dropoffAddress !== dropoffAddress) { booking.dropoffAddress = dropoffAddress; recalculate = true; }
                if (pickupCoordinates && (booking.pickupCoordinates.lat !== pickupCoordinates.lat || booking.pickupCoordinates.lng !== pickupCoordinates.lng)) { booking.pickupCoordinates = pickupCoordinates; recalculate = true; }
                if (dropoffCoordinates && (booking.dropoffCoordinates.lat !== dropoffCoordinates.lat || booking.dropoffCoordinates.lng !== dropoffCoordinates.lng)) { booking.dropoffCoordinates = dropoffCoordinates; recalculate = true; }

                if (recalculate) {
                    newPickupDropoffDistance = calculateDistance(booking.pickupCoordinates, booking.dropoffCoordinates);
                    newPickupDropoffCost = newPickupDropoffDistance * workshop.pickupDropoffChargePerKm;
                    booking.pickupDropoffDistance = newPickupDropoffDistance;
                    booking.pickupDropoffCost = newPickupDropoffCost;
                }
            }
        }

        booking.totalCost = newTotalCost;

        let calculatedFinalAmount = newTotalCost + booking.pickupDropoffCost;
        if (booking.discountApplied) {
            booking.finalAmount = calculatedFinalAmount - (calculatedFinalAmount * 0.20);
        } else {
            booking.finalAmount = calculatedFinalAmount;
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

const deleteUserBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has been paid for.' });
        
        if (booking.discountApplied) {
            const user = await User.findById(req.user.id);
            if (user) {
                user.loyaltyPoints += 100;
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

const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;
    if (paymentMethod !== 'COD') return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });

    try {
        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.customer._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });
        if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

        const points = await awardLoyaltyPoints(req.user.id);
        
        booking.paymentMethod = 'COD';
        booking.paymentStatus = 'Paid'; 
        booking.isPaid = true; 
        booking.pointsAwarded = points;
        await booking.save();
        
        res.status(200).json({ success: true, data: booking, message: `Payment confirmed! You've earned ${points} loyalty points.` });

        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                        <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/>
                        <h2 style="color: #2c3e50;">Booking Confirmed!</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${booking.customer.fullName},</p>
                        <p>Your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> has been confirmed.</p>
                        <p>You have earned <strong>${points} loyalty points</strong> for this booking!</p>
                        <p>Please pay <strong>Rs. ${booking.finalAmount}</strong> upon service completion.</p>
                        <p>Payment Method: <strong>Cash on Delivery (COD)</strong></p>
                        <p>Thank you for choosing MotoFix!</p>
                    </div>
                    <hr/>
                    <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                </div>
            `;
            await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml);
        } catch(emailError) {
            console.error("Error sending COD confirmation email:", emailError);
        }
    } catch (error) {
        console.error(error);
        if(!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
};

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
            const booking = await Booking.findById(booking_id).populate('customer', 'fullName email');
            if (!booking) return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            if (booking.isPaid) return res.status(400).json({ success: false, message: 'Booking is already paid.' });

            const points = await awardLoyaltyPoints(req.user.id);

            booking.paymentMethod = 'Khalti';
            booking.paymentStatus = 'Paid';
            booking.isPaid = true;
            booking.pointsAwarded = points;
            await booking.save();
            
            res.status(200).json({ success: true, message: `Payment successful! You've earned ${points} loyalty points.` });

            try {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                            <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/>
                            <h2 style="color: #2c3e50;">Payment Successful!</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Dear ${booking.customer.fullName},</p>
                            <p>Your payment for booking <strong>#${booking._id}</strong> has been successfully processed via Khalti.</p>
                            <p>You have earned <strong>${points} loyalty points</strong> for this booking!</p>
                            <p>Your appointment for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> is confirmed.</p>
                            <p>Total Amount Paid: <strong>Rs. ${booking.finalAmount}</strong></p>
                            <p>Thank you for choosing MotoFix!</p>
                        </div>
                        <hr/>
                        <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                    </div>
                `;
                await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml);
            } catch (emailError) {
                console.error("Error sending Khalti success email:", emailError);
            }

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

        const discountValue = (booking.totalCost + booking.pickupDropoffCost) * 0.20;
        booking.finalAmount = (booking.totalCost + booking.pickupDropoffCost) - discountValue;
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
    applyLoyaltyDiscount,
    getUserBookingById,
    getPendingBookings,
    getBookingHistory
};