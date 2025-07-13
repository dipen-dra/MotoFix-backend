// controllers/admin/bookingController.js

const Booking = require('../../models/Booking.js');
const User = require('../../models/User.js');
const sendEmail = require('../../utils/sendEmail.js');
const puppeteer = require('puppeteer');
const { getInvoiceHTML } = require('../../utils/invoiceTemplate.js');
const Workshop = require('../../models/Workshop.js');

const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg';
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXmC_iDsPK_BXQ=';

exports.getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let matchQuery = { isPaid: true, archivedByAdmin: { $ne: true } };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId; 
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            matchQuery.workshop = workshopId; 
        }

        if (search) {
            matchQuery.$or = [
                { 'customer.fullName': { $regex: search, $options: 'i' } },
                { 'serviceType': { $regex: search, $options: 'i' } },
                { 'bikeModel': { $regex: search, $options: 'i' } }
            ];
        }

        const bookingsAggregation = await Booking.aggregate([
            { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
            { $unwind: '$customer' },
            { $match: matchQuery },
            { $sort: { createdAt: -1 } },
            { $facet: { metadata: [{ $count: 'totalItems' }], data: [{ $skip: skip }, { $limit: limit }] } }
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

exports.getBookingById = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        }

        const booking = await Booking.findOne(findQuery)
                                    .populate('customer', 'fullName email phone address')
                                    .populate('workshop', 'workshopName'); 
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not authorized for your role/workshop' });
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        console.error(`Error fetching booking by ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { status, totalCost } = req.body;
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        }

        const booking = await Booking.findOne(findQuery).populate('customer', 'fullName email');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not authorized for your role/workshop' });
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

        await booking.save();
        
        const updatedBookingWithPopulation = await Booking.findById(booking._id).populate('customer', 'fullName email phone address').populate('workshop', 'workshopName');

        if (statusChanged && booking.customer) {
            const io = req.app.get('socketio');
            const userRoom = `chat-${booking.customer._id.toString()}`;
            io.to(userRoom).emit('booking_status_update', {
                bookingId: updatedBookingWithPopulation._id,
                serviceType: updatedBookingWithPopulation.serviceType,
                newStatus: updatedBookingWithPopulation.status,
                message: `Your booking for "${updatedBookingWithPopulation.serviceType}" at ${updatedBookingWithPopulation.workshop?.workshopName || 'MotoFix'} is now ${updatedBookingWithPopulation.status}.`
            });
        }

        res.json({ success: true, data: updatedBookingWithPopulation, message: "Booking updated successfully." });

        if (statusChanged && booking.customer && status === 'Completed') {
             try {
                const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"> <div style="text-align: center; padding: 20px; background-color: #f8f8f8;"> <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/> <h2 style="color: #27ae60;">Your Service is Complete!</h2> </div> <div style="padding: 20px;"> <p>Dear ${booking.customer.fullName},</p> <p>We are pleased to inform you that your booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> has been marked as <strong>Completed</strong> at <strong>${updatedBookingWithPopulation.workshop?.workshopName || 'MotoFix'}</strong>.</p> <p>We hope you are satisfied with our service. Please feel free to provide any feedback.</p> <p>Thank you again for choosing MotoFix!</p> </div> <hr/> <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p> </div>`;
                sendEmail(booking.customer.email, 'Your MotoFix Service is Complete!', emailHtml)
                    .catch(err => console.error('Error sending completion email:', err));
            } catch (emailError) {
                console.error('Error preparing completion email:', emailError);
            }
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error while updating booking.' });
        }
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        }

        const booking = await Booking.findOne(findQuery).populate('customer', 'fullName email loyaltyPoints').populate('workshop', 'workshopName');
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found or not authorized for your role/workshop." });
        }

        let responseMessage;

        if (booking.status === 'Pending' || booking.status === 'In Progress') {
            booking.status = 'Cancelled';
            booking.archivedByAdmin = true;
            responseMessage = "Booking has been cancelled and removed from view. User has been notified.";

            let pointsReversalMessage = '';
            if (booking.customer) {
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
                        pointsReversalMessage += `<p>The <strong>100 loyalty points</strong> you used have been refunded.</p>`;
                        pointsChanged = true;
                    }
                    if (pointsChanged) {
                        if (user.loyaltyPoints < 0) user.loyaltyPoints = 0;
                        await user.save();
                    }
                }
            }

            if (booking.customer && booking.customer.email) {
                const subject = 'Your MotoFix Booking Has Been Cancelled';
                let refundMessage = booking.isPaid && booking.paymentMethod !== 'COD'
                    ? `<p>A refund for <strong>Rs. ${booking.finalAmount}</strong> will be processed shortly.</p>`
                    : '';
                const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"> <div style="text-align: center; padding: 20px; background-color: #f8f8f8;"> <img src="${CANCEL_ICON_URL}" alt="Cancellation Icon" style="width: 80px;"/> <h2 style="color: #c0392b;">Booking Cancelled at ${booking.workshop?.workshopName || 'MotoFix'}</h2> </div> <div style="padding: 20px;"> <p>Dear ${booking.customer.fullName},</p> <p>We're writing to inform you that your booking <strong>#${booking._id}</strong> for <strong>"${booking.serviceType}"</strong> has been cancelled by our administration.</p> ${refundMessage} ${pointsReversalMessage} <p>We apologize for any inconvenience.</p> <p>Thank you,<br>The MotoFix Team</p> </div></div>`;
                sendEmail(booking.customer.email, subject, emailHtml)
                    .catch(err => console.error("Error sending cancellation email:", err));
            }

        } else {
            booking.archivedByAdmin = true;
            responseMessage = "Booking has been archived and removed from view.";
        }

        await booking.save();
        
        res.status(200).json({ success: true, message: responseMessage });

    } catch (error) {
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.generateBookingInvoice = async (req, res) => {
    try {
        let findQuery = { _id: req.params.id };

        let workshopDetailsForInvoice = req.workshopDetails; 

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            if (!workshopId) {
                return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
            }
            findQuery.workshop = workshopId;
        } else if (req.user.role === 'superadmin') {
            // For superadmin, they can generate invoice for any booking.
        }

        const booking = await Booking.findOne(findQuery)
            .populate('customer', 'fullName email phone address')
            .populate('workshop', 'workshopName address phone'); 

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not authorized for your role/workshop.' });
        }
        
        if (!booking.isPaid) {
            return res.status(400).json({ success: false, message: 'Cannot generate an invoice for an unpaid booking.' });
        }

        if (req.user.role === 'superadmin' || !workshopDetailsForInvoice) {
            workshopDetailsForInvoice = {
                workshopName: booking.workshop?.workshopName || 'MotoFix Workshop',
                address: booking.workshop?.address || 'N/A',
                phone: booking.workshop?.phone || 'N/A'
            };
        }

        const htmlContent = getInvoiceHTML(booking, workshopDetailsForInvoice);

        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking._id}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF invoice:', error);
        res.status(500).json({ success: false, message: 'Server error while generating invoice.' });
    }
};