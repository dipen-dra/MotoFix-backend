/**
 * @file controllers/admin/bookingController.js
 * @description Controller for admin-facing booking management.
 */

import Booking from '../../models/Booking.js';
import sendEmail from '../../utils/sendEmail.js'; // Import the email utility

/**
 * @desc      Get all paid bookings for the admin
 * @route     GET /api/admin/bookings
 * @access    Private/Admin
 */
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true })
            .populate('customer', 'fullName email phone address')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error("Admin getBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc      Get a single booking by ID
 * @route     GET /api/admin/bookings/:id
 * @access    Private/Admin
 */
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

/**
 * @desc      Update a booking's status or cost
 * @route     PUT /api/admin/bookings/:id
 * @access    Private/Admin
 */
export const updateBooking = async (req, res) => {
    try {
        const { status, totalCost } = req.body;
        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        let statusChanged = false;
        // Update status if provided
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
        
        // Update totalCost if provided
        if (totalCost !== undefined) {
            booking.totalCost = totalCost;
            // If discount was applied, recalculate final amount
            if (booking.discountApplied) {
                booking.finalAmount = totalCost - (totalCost * 0.20);
            } else {
                booking.finalAmount = totalCost;
            }
        }

        const updatedBooking = await booking.save();
        
        // ---  SEND RESPONSE TO CLIENT IMMEDIATELY ---
        // Do not wait for the email to send. This resolves the delay.
        res.json({ success: true, data: updatedBooking, message: "Booking updated successfully." });

        // --- SEND EMAIL NOTIFICATION IN THE BACKGROUND ---
        // Check if status was changed to 'Completed' and the customer exists
        if (statusChanged && status === 'Completed' && booking.customer) {
            // Use a separate try/catch for the email to prevent crashing the server if email fails
            try {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                            <img src="cid:logo" alt="MotoFix Logo" style="width: 150px;"/>
                            <h2 style="color: #27ae60;">Your Service is Complete!</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Dear ${booking.customer.fullName},</p>
                            <p>We are pleased to inform you that your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> has been marked as <strong>Completed</strong>.</p>
                            <p>We hope you are satisfied with our service. Please feel free to provide any feedback.</p>
                            <p>Thank you again for choosing MotoFix!</p>
                        </div>
                        <hr/>
                        <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                    </div>
                `;
                const attachments = [{
                    filename: 'logo.png',
                    path: 'https://pplx-res.cloudinary.com/image/upload/v1751135827/gpt4o_images/pdlz3nvtduzpqhnkuova.png', // Replace with your logo URL
                    cid: 'logo'
                }];
                
                // No 'await' here. Let it run in the background.
                sendEmail(booking.customer.email, 'Your MotoFix Service is Complete!', emailHtml, attachments);
                
            } catch (emailError) {
                // Log any errors that occur during email sending
                console.error('Error sending completion email:', emailError);
            }
        }
        // --- END OF EMAIL NOTIFICATION ---

    } catch (error) {
        console.error('Error updating booking:', error);
        // Make sure a response is not sent twice
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error while updating booking.' });
        }
    }
};

/**
 * @desc      Delete a booking
 * @route     DELETE /api/admin/bookings/:id
 * @access    Private/Admin
 */
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        res.status(200).json({ success: true, message: "Booking deleted successfully." });
    } catch (error) {
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};