/**
 * @file controllers/user/bookingController.js
 * @description Controller for user-facing booking operations.
 */

// --- MODIFIED: Use require() for all imports ---
const Booking = require('../../models/Booking.js');
const Service = require('../../models/Service.js');
const User = require('../../models/User.js');
const Workshop = require('../../models/Workshop.js'); // Import Workshop model
const axios = require('axios'); // For Khalti/eSewa, but now needs to be imported with require
const sendEmail = require('../../utils/sendEmail.js');

// --- Icon URLs for direct use in email HTML for better reliability ---
const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg'; // Green tick icon
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXmC_iDsPK_BXQ=';  // Red cross icon

// Helper function to award loyalty points
const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        const pointsToAdd = Math.floor(Math.random() * 11) + 10; // 10 to 20 points
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();
        return pointsToAdd;
    }
    return 0;
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.getUserBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 11;
        const skip = (page - 1) * limit;

        const query = { customer: req.user.id };

        const totalItems = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('workshop', 'workshopName address phone') // Populate workshop details
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
        console.error("User getUserBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.getUserBookingById = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id })
                                     .populate('workshop', 'workshopName address phone'); // Populate workshop details
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized.' });
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        console.error("User getUserBookingById Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user.id, paymentStatus: 'Pending', status: { $ne: 'Cancelled' } })
                                     .populate('workshop', 'workshopName address phone') // Populate workshop details
                                     .sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error("User getPendingBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.getBookingHistory = async (req, res) => {
    try {
        const query = { customer: req.user.id, paymentStatus: 'Paid' };

        const bookings = await Booking.find(query)
                                     .populate('workshop', 'workshopName address phone') // Populate workshop details
                                     .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        console.error("User getBookingHistory Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.createBooking = async (req, res) => {
    const { 
        serviceId, 
        bikeModel, 
        date, 
        notes, 
        workshopId, // NEW: Workshop ID
        pickupDropoffRequested, // NEW: Boolean flag
        pickupDropoffAddress // NEW: Optional custom pickup address
    } = req.body;

    if (!serviceId || !bikeModel || !date || !workshopId) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields (service, bike model, date, and workshop).' });
    }

    try {
        const user = await User.findById(req.user.id);
        const service = await Service.findById(serviceId);
        const workshop = await Workshop.findById(workshopId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
        if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not found.' });

        // Ensure the service actually belongs to the selected workshop
        if (!service.workshop.equals(workshop._id)) {
            return res.status(400).json({ success: false, message: 'Service does not belong to the selected workshop.' });
        }

        let calculatedPickupDropoffCost = 0;
        let finalBookingAddress = user.address;

        if (pickupDropoffRequested) {
            if (!workshop.pickupDropoffAvailable) {
                return res.status(400).json({ success: false, message: 'The selected workshop does not offer pickup/drop-off services.' });
            }
            
            // Determine the coordinates for distance calculation
            let userCoords = user.location?.coordinates;
            
            // If a custom pickup address is provided, and it's different from the user's saved address,
            // we should ideally geocode it. For now, if no coordinates are available for the user
            // or the workshop, we can't calculate cost.
            if (!userCoords || (userCoords[0] === 0 && userCoords[1] === 0)) {
                 return res.status(400).json({ success: false, message: 'Your location is required for pickup/drop-off service. Please update your profile.' });
            }

            const workshopCoords = workshop.location?.coordinates;

            if (userCoords && workshopCoords && userCoords[0] !== 0 && userCoords[1] !== 0 && workshopCoords[0] !== 0 && workshopCoords[1] !== 0) {
                 // Calculate distance between user and workshop (Haversine formula approximation)
                const R = 6371; // Radius of Earth in kilometers
                const dLat = (workshopCoords[1] - userCoords[1]) * Math.PI / 180;
                const dLon = (workshopCoords[0] - userCoords[0]) * Math.PI / 180;
                const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userCoords[1] * Math.PI / 180) * Math.cos(workshopCoords[1] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distanceKm = R * c; // Distance in km

                calculatedPickupDropoffCost = distanceKm * workshop.pickupDropoffCostPerKm * 2; // Multiply by 2 for round trip
                calculatedPickupDropoffCost = Math.round(calculatedPickupDropoffCost / 10) * 10; // Round to nearest 10
            } else {
                console.warn("Could not calculate pickup/drop-off cost due to missing or zero coordinates. Setting to 0.");
                calculatedPickupDropoffCost = 0; // Fallback if coordinates are missing
            }
            
            finalBookingAddress = pickupDropoffAddress || user.address;
        }

        const totalCostExcludingPickup = service.price;
        const initialFinalAmount = totalCostExcludingPickup + calculatedPickupDropoffCost;

        const booking = new Booking({
            customer: user._id,
            workshop: workshop._id, // Assign booking to the selected workshop
            service: serviceId,
            bikeModel,
            date,
            notes,
            customerName: user.fullName,
            serviceType: service.name,
            totalCost: totalCostExcludingPickup, // This is service cost, before pickup/drop-off
            finalAmount: initialFinalAmount, // This includes pickup/drop-off if applicable
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
            pickupDropoffRequested: pickupDropoffRequested || false,
            pickupDropoffAddress: finalBookingAddress,
            pickupDropoffCost: calculatedPickupDropoffCost
        });

        await booking.save();
        res.status(201).json({ success: true, data: booking, message: "Booking created. Please complete payment." });
    } catch (error) {
        console.error("User createBooking Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.updateUserBooking = async (req, res) => {
    try {
        const { serviceId, bikeModel, date, notes, pickupDropoffRequested, pickupDropoffAddress } = req.body;
        let booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.customer.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'User not authorized' });
        if (booking.status !== 'Pending' || booking.isPaid || booking.discountApplied) {
            return res.status(400).json({ success: false, message: `Cannot edit a booking that is already in progress, paid, or has a discount.` });
        }

        let newServicePrice = booking.totalCost; // Default to current
        let newPickupDropoffCost = booking.pickupDropoffCost; // Default to current
        let finalBookingAddress = booking.pickupDropoffAddress; // Default to current

        // If service is being changed
        if (serviceId && serviceId.toString() !== booking.service.toString()) {
            const newService = await Service.findById(serviceId);
            if (!newService) return res.status(404).json({ success: false, message: 'New service not found.' });
            
            // Ensure new service belongs to the SAME workshop as original booking
            if (!newService.workshop.equals(booking.workshop)) {
                return res.status(400).json({ success: false, message: 'Cannot change service to one from a different workshop.' });
            }

            booking.service = newService._id;
            booking.serviceType = newService.name;
            newServicePrice = newService.price;
        }

        // Handle pickup/drop-off updates
        let pickupDropoffChanged = false;
        if (pickupDropoffRequested !== undefined && pickupDropoffRequested !== booking.pickupDropoffRequested) {
            pickupDropoffChanged = true;
            booking.pickupDropoffRequested = pickupDropoffRequested;
        }
        if (pickupDropoffAddress !== undefined && pickupDropoffAddress !== booking.pickupDropoffAddress) {
            pickupDropoffChanged = true;
            booking.pickupDropoffAddress = pickupDropoffAddress;
        }

        if (pickupDropoffChanged || (serviceId && serviceId.toString() !== booking.service.toString())) {
            // Recalculate pickup/drop-off cost if pickup/drop-off status changes, or service changes
            const workshop = await Workshop.findById(booking.workshop);
            if (!workshop) {
                console.error("Workshop not found for booking during update cost recalculation:", booking.workshop);
                // Decide how to handle: error, or proceed without pickup cost
                newPickupDropoffCost = 0; 
                if (booking.pickupDropoffRequested) {
                     return res.status(500).json({ success: false, message: "Workshop data missing for pickup calculation." });
                }
            } else if (booking.pickupDropoffRequested) {
                if (!workshop.pickupDropoffAvailable) {
                    return res.status(400).json({ success: false, message: 'The selected workshop no longer offers pickup/drop-off services. Please unselect or choose a different workshop.' });
                }

                const user = await User.findById(req.user.id);
                let userCoords = user.location?.coordinates;
                finalBookingAddress = booking.pickupDropoffAddress || user.address; // Use updated address if present

                // If pickup/drop-off is still requested, recalculate based on potentially new service or address
                if (userCoords && workshop.location?.coordinates && userCoords[0] !== 0 && userCoords[1] !== 0 && workshop.location.coordinates[0] !== 0 && workshop.location.coordinates[1] !== 0) {
                     const R = 6371; // Radius of Earth in kilometers
                    const dLat = (workshop.location.coordinates[1] - userCoords[1]) * Math.PI / 180;
                    const dLon = (workshop.location.coordinates[0] - userCoords[0]) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(userCoords[1] * Math.PI / 180) * Math.cos(workshop.location.coordinates[1] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distanceKm = R * c; // Distance in km

                    newPickupDropoffCost = distanceKm * workshop.pickupDropoffCostPerKm * 2; // Multiply by 2 for round trip
                    newPickupDropoffCost = Math.round(newPickupDropoffCost / 10) * 10; // Round to nearest 10
                } else {
                    console.warn("Could not calculate pickup/drop-off cost during update due to missing coordinates.");
                    newPickupDropoffCost = 0;
                }
            } else {
                newPickupDropoffCost = 0; // Pickup/drop-off no longer requested
                finalBookingAddress = ''; // Clear address if service is no longer needed
            }
        }
        
        booking.bikeModel = bikeModel || booking.bikeModel;
        booking.date = date || booking.date;
        booking.notes = notes !== undefined ? notes : booking.notes;
        booking.totalCost = newServicePrice; // Update base service cost
        booking.pickupDropoffCost = newPickupDropoffCost;
        booking.pickupDropoffAddress = finalBookingAddress;


        // Recalculate final amount based on updated totalCost and pickup/drop-off cost
        let newFinalAmount = newServicePrice + newPickupDropoffCost;
        if (booking.discountApplied) {
            // Reapply discount to the new total cost
            const discountValue = newFinalAmount * 0.20;
            newFinalAmount -= discountValue;
            booking.discountAmount = discountValue; // Update stored discount amount
        }
        booking.finalAmount = newFinalAmount;

        await booking.save();
        res.json({ success: true, data: booking, message: 'Booking updated successfully' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;
    if (paymentMethod !== 'COD') return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });

    try {
        const booking = await Booking.findById(req.params.id)
                                     .populate('customer', 'fullName email')
                                     .populate('workshop', 'workshopName address phone'); // Populate workshop for email

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
                        <p>Your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> at <strong>${booking.workshop?.workshopName || 'MotoFix'}</strong> has been confirmed.</p>
                        ${booking.pickupDropoffRequested ? `<p>A technician will pick up your bike from <strong>${booking.pickupDropoffAddress}</strong>.</p>` : `<p>Please drop off your bike at <strong>${booking.workshop?.address || 'the workshop'}</strong>.</p>`}
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
        console.error("User confirmPayment Error:", error);
        if(!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
};

// --- MODIFIED: Use exports.functionName for consistency ---
exports.verifyKhaltiPayment = async (req, res) => {
    const { token, amount, booking_id } = req.body;
    if (!token || !amount || !booking_id) return res.status(400).json({ success: false, message: 'Missing payment verification details.' });

    try {
        const khaltiResponse = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            { token, amount }, 
            { headers: { 'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}` } }
        );

        if (khaltiResponse.data && khaltiResponse.data.idx) {
            const booking = await Booking.findById(booking_id)
                                         .populate('customer', 'fullName email')
                                         .populate('workshop', 'workshopName address phone'); // Populate workshop for email
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
                            <p>Your appointment for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> at <strong>${booking.workshop?.workshopName || 'MotoFix'}</strong> is confirmed.</p>
                            ${booking.pickupDropoffRequested ? `<p>A technician will pick up your bike from <strong>${booking.pickupDropoffAddress}</strong>.</p>` : `<p>Please drop off your bike at <strong>${booking.workshop?.address || 'the workshop'}</strong>.</p>`}
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

// --- MODIFIED: Use exports.functionName for consistency ---
exports.applyLoyaltyDiscount = async (req, res) => {
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

        // Calculate discount based on current finalAmount (which includes pickup/dropoff if applicable)
        const discountValue = booking.finalAmount * 0.20;
        booking.finalAmount = booking.finalAmount - discountValue;
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

// --- MODIFIED: Use exports.functionName for consistency ---
exports.deleteUserBooking = async (req, res) => {
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