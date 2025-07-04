/**
@file controllers/admin/bookingController.js
@description Controller for admin-facing booking management with pagination and search.
*/
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import sendEmail from '../../utils/sendEmail.js';

const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg';
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXmC_iDsPK_BXQ=';

// --- NEW: Paginated and Searchable Function ---
export const getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build the match query for the aggregation pipeline
        const matchQuery = { isPaid: true };
        if (search) {
            matchQuery.$or = [
                { 'customer.fullName': { $regex: search, $options: 'i' } },
                { 'serviceType': { $regex: search, $options: 'i' } }
            ];
        }

        // Using an aggregation pipeline to search on populated fields
        const bookingsAggregation = await Booking.aggregate([
            // Stage 1: Join with the users collection
            {
                $lookup: {
                    from: 'users', // The name of the users collection
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            // Stage 2: Deconstruct the customer array
            { $unwind: '$customer' },
            // Stage 3: Apply the search filter
            { $match: matchQuery },
            // Stage 4: Sort the results
            { $sort: { createdAt: -1 } },
            // Stage 5: Facet for pagination and total count
            {
                $facet: {
                    metadata: [{ $count: 'totalItems' }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ]);

        const bookings = bookingsAggregation[0].data;
        const totalItems = bookingsAggregation[0].metadata[0] ? bookingsAggregation[0].metadata[0].totalItems : 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            success: true,
            data: bookings,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error("Admin getBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// --- UNCHANGED FUNCTIONS ---
export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'fullName email phone address');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, data: booking });

    } catch (error) {
        console.error(`Error fetching booking by ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateBooking = async (req, res) => {
    try {
        const { status, totalCost } = req.body;
        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        let statusChanged = false;
        if (status) {
            const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status value' });
            }
            if (booking.status !== status) {
                booking.status = status;
                statusChanged = true;
            }
        }

        if (totalCost !== undefined) {
            booking.totalCost = totalCost;
            if (booking.discountApplied) {
                booking.finalAmount = totalCost - (totalCost * 0.20);
            } else {
                booking.finalAmount = totalCost;
            }
        }

        // The frontend expects the fully populated customer object back.
        // We already have it from the initial query, so we just need to save and return it.
        await booking.save();
        
        // Manually re-populate the returned object to ensure frontend gets all fields
        const updatedBookingWithPopulation = await Booking.findById(booking._id)
            .populate('customer', 'fullName email phone address');

        res.json({ success: true, data: updatedBookingWithPopulation, message: "Booking updated successfully." });

        if (statusChanged && booking.customer) {
            if (status === 'Completed') {
                try {
                    const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"> <div style="text-align: center; padding: 20px; background-color: #f8f8f8;"> <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/> <h2 style="color: #27ae60;">Your Service is Complete!</h2> </div> <div style="padding: 20px;"> <p>Dear ${booking.customer.fullName},</p> <p>We are pleased to inform you that your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> has been marked as <strong>Completed</strong>.</p> <p>We hope you are satisfied with our service. Please feel free to provide any feedback.</p> <p>Thank you again for choosing MotoFix!</p> </div> <hr/> <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p> </div>`;
                    sendEmail(booking.customer.email, 'Your MotoFix Service is Complete!', emailHtml)
                        .catch(err => console.error('Error sending completion email:', err));
                } catch (emailError) {
                    console.error('Error preparing completion email:', emailError);
                }
            } else if (status === 'Cancelled') {
                try {
                    let pointsReversalMessage = '';
                    const user = await User.findById(booking.customer._id);
                    if (user) {
                        let pointsChanged = false;
                        if (booking.pointsAwarded > 0) {
                            user.loyaltyPoints -= booking.pointsAwarded;
                            pointsReversalMessage += `<p>The <strong>${booking.pointsAwarded} loyalty points</strong> you earned have been reversed.</p>`;
                            pointsChanged = true;
                        }
                        if (booking.discountApplied) {
                            user.loyaltyPoints += 100;
                            pointsReversalMessage += `<p>The <strong>100 loyalty points</strong> you used for a discount have been refunded to your account.</p>`;
                            pointsChanged = true;
                        }
                        if (pointsChanged) {
                            if (user.loyaltyPoints < 0) user.loyaltyPoints = 0;
                            await user.save();
                        }
                    }

                    let refundMessage = '';
                    if (booking.isPaid && booking.paymentMethod !== 'COD') {
                        refundMessage = `<p>Since your payment was already completed via <strong>${booking.paymentMethod}</strong>, a refund for the amount of <strong>Rs. ${booking.finalAmount}</strong> will be processed and sent to your original payment account shortly.</p>`;
                    }

                    const subject = 'Your MotoFix Booking Has Been Cancelled';
                    const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"> <div style="text-align: center; padding: 20px; background-color: #f8f8f8;"> <img src="${CANCEL_ICON_URL}" alt="Cancellation Icon" style="width: 80px;"/> <h2 style="color: #c0392b;">Booking Cancelled</h2> </div> <div style="padding: 20px;"> <p>Dear ${booking.customer.fullName},</p> <p>We're writing to inform you that your booking <strong>#${booking._id}</strong> for the service <strong>"${booking.serviceType}"</strong> has been cancelled by our administration.</p> ${refundMessage} ${pointsReversalMessage} <p>We apologize for any inconvenience this may cause. If you have any questions, please feel free to contact our support.</p> <p>Thank you,<br>The MotoFix Team</p> </div> <hr/> <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p> </div>`;
                    sendEmail(booking.customer.email, subject, emailHtml)
                        .catch(err => console.error("Error sending status-update cancellation email:", err));
                } catch (emailError) {
                    console.error("Error preparing cancellation email on status update:", emailError);
                }
            }
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error while updating booking.' });
        }
    }
};

export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email loyaltyPoints');
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        let pointsReversalMessage = '';
        if (booking.customer) {
            const user = await User.findById(booking.customer._id);
            if (user) {
                let pointsChanged = false;
                if (booking.pointsAwarded > 0) {
                    user.loyaltyPoints -= booking.pointsAwarded;
                    pointsReversalMessage += `<p>The <strong>${booking.pointsAwarded} loyalty points</strong> you earned from this booking have been reversed.</p>`;
                    pointsChanged = true;
                }
                if (booking.discountApplied) {
                    user.loyaltyPoints += 100;
                    pointsReversalMessage += `<p>The <strong>100 loyalty points</strong> you used for a discount on this booking have been refunded.</p>`;
                    pointsChanged = true;
                }
                if (pointsChanged) {
                    if (user.loyaltyPoints < 0) user.loyaltyPoints = 0;
                    await user.save();
                }
            }
        }

        if (booking.customer && booking.customer.email) {
            try {
                const subject = 'Your MotoFix Booking Has Been Cancelled';
                let refundMessage = '';
                if (booking.isPaid && booking.paymentMethod !== 'COD') {
                    refundMessage = `<p>Since your payment was already completed via <strong>${booking.paymentMethod}</strong>, a refund for the amount of <strong>Rs. ${booking.finalAmount}</strong> will be processed and sent to your original payment account shortly.</p>`;
                }
                const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"> <div style="text-align: center; padding: 20px; background-color: #f8f8f8;"> <img src="${CANCEL_ICON_URL}" alt="Cancellation Icon" style="width: 80px;"/> <h2 style="color: #c0392b;">Booking Cancelled</h2> </div> <div style="padding: 20px;"> <p>Dear ${booking.customer.fullName},</p> <p>We're writing to inform you that your booking <strong>#${booking._id}</strong> for the service <strong>"${booking.serviceType}"</strong> has been cancelled by our administration.</p> ${refundMessage} ${pointsReversalMessage} <p>We apologize for any inconvenience this may cause. If you have any questions, please feel free to contact our support.</p> <p>Thank you,<br>The MotoFix Team</p> </div> <hr/> <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p> </div>`;
                sendEmail(booking.customer.email, subject, emailHtml)
                    .catch(err => console.error("Error sending cancellation email:", err));
            } catch (emailError) {
                console.error("Error preparing cancellation email:", emailError);
            }
        }
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Booking deleted successfully. A notification has been sent to the user." });
    } catch (error) {
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};