// controllers/esewaController.js

const crypto = require('crypto');
const fetch = require('node-fetch');
const Booking = require('../models/Booking.js');
const User = require('../models/User.js');
const sendEmail = require('../utils/sendEmail.js');
const Workshop = require('../models/Workshop.js'); // Import Workshop model
const axios = require('axios'); // Add axios import for Khalti verification logic

// --- Icon URL for direct use in email HTML ---
const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg'; // Green tick icon
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXmC_iDsPK_BXQ=';  // Red cross icon

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

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


const initiateEsewaPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.finalAmount == null) return res.status(400).json({ message: 'Booking does not have a final amount to pay.' });
        if (booking.isPaid) return res.status(400).json({ message: 'Booking is already paid.' });

        const amountToPay = booking.finalAmount.toString();
        const signedFieldNames = 'total_amount,transaction_uuid,product_code';
        const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;

        const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
        hmac.update(signatureBaseString);
        const signature = hmac.digest('base64');

        const esewaData = {
            amount: amountToPay,
            // Ensure these URLs are correct for your frontend and the environment (dev/prod)
            success_url: `http://localhost:5173/#/user/my-payments?status=success&message=Payment successful!`,
            failure_url: `http://localhost:5173/#/user/my-payments?status=failure&message=Payment failed or cancelled.`,
            product_delivery_charge: '0',
            product_service_charge: '0',
            product_code: ESEWA_SCD,
            signature,
            signed_field_names: signedFieldNames,
            tax_amount: '0',
            total_amount: amountToPay,
            transaction_uuid: bookingId,
        };

        console.log("eSewa Request Data:", esewaData); // Log the data being sent
        console.log("Signature Base String:", signatureBaseString);
        console.log("Calculated Signature:", signature);

        res.json({ ...esewaData, ESEWA_URL });
    } catch (error) {
        console.error('Error in initiateEsewaPayment:', error);
        res.status(500).json({ message: 'Server Error while initiating payment' });
    }
};
// const initiateEsewaPayment = async (req, res) => { // Changed from exports.initiateEsewaPayment
//     try {
//         const { bookingId } = req.body;
//         const booking = await Booking.findById(bookingId);

//         if (!booking) return res.status(404).json({ message: 'Booking not found' });
//         if (booking.finalAmount == null) return res.status(400).json({ message: 'Booking does not have a final amount to pay.' });
//         if (booking.isPaid) return res.status(400).json({ message: 'Booking is already paid.' });


//         const amountToPay = booking.finalAmount.toString();
//         const signedFieldNames = 'total_amount,transaction_uuid,product_code';
//         const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;
        
//         const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
//         hmac.update(signatureBaseString);
//         const signature = hmac.digest('base64');

//         const esewaData = {
//             amount: amountToPay,
//             success_url: `http://localhost:5173/payment/esewa/success`,
//             failure_url: 'http://localhost:5173/payment/esewa/failure',
//             product_delivery_charge: '0',
//             product_service_charge: '0',
//             product_code: ESEWA_SCD,
//             signature,
//             signed_field_names: signedFieldNames,
//             tax_amount: '0',
//             total_amount: amountToPay,
//             transaction_uuid: bookingId,
//         };

//         res.json({ ...esewaData, ESEWA_URL });
//     } catch (error) {
//         console.error('Error in initiateEsewaPayment:', error);
//         res.status(500).json({ message: 'Server Error while initiating payment' });
//     }
// };

const verifyEsewaPayment = async (req, res) => { // Changed from exports.verifyEsewaPayment
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ success: false, message: 'No data provided for verification' });
        }

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

        if (decodedData.status !== 'COMPLETE') {
            return res.status(400).json({ success: false, message: `Payment not complete. Status: ${decodedData.status}` });
        }

        const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;

        const response = await fetch(verificationUrl);
        const verificationResponse = await response.json();

        if (verificationResponse.status === 'COMPLETE') {
            const booking = await Booking.findById(decodedData.transaction_uuid)
                                         .populate('customer', 'fullName email')
                                         .populate('workshop', 'workshopName address phone'); // Populate workshop for email

            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            }
            if (booking.isPaid) {
                return res.status(200).json({ success: true, message: 'Payment was already verified.' });
            }
            
            const points = await awardLoyaltyPoints(booking.customer._id);

            booking.paymentStatus = 'Paid';
            booking.paymentMethod = 'eSewa';
            booking.isPaid = true;
            booking.pointsAwarded = points;
            await booking.save();

            res.status(200).json({ success: true, message: `Payment successful! You earned ${points} loyalty points.` });

            try {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                            <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/>
                            <h2 style="color: #2c3e50;">Payment Successful!</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Dear ${booking.customer.fullName},</p>
                            <p>Your payment for booking <strong>#${booking._id}</strong> has been successfully processed via eSewa.</p>
                            <p>Your appointment for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> at <strong>${booking.workshop?.workshopName || 'MotoFix'}</strong> is confirmed.</p>
                            ${booking.pickupDropoffRequested ? `<p>A technician will pick up your bike from <strong>${booking.pickupDropoffAddress}</strong>.</p>` : `<p>Please drop off your bike at <strong>${booking.workshop?.address || 'the workshop'}</strong>.</p>`}
                            <p>You have earned <strong>${points} loyalty points</strong> for this booking!</p>
                            <p>Total Amount Paid: <strong>Rs. ${booking.finalAmount}</strong></p>
                            <p>Thank you for choosing MotoFix!</p>
                        </div>
                        <hr/>
                        <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
                    </div>
                `;
                await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml);
            } catch (emailError) {
                console.error("Error sending eSewa success email:", emailError);
            }

        } else {
            res.status(400).json({ success: false, message: 'eSewa payment verification failed' });
        }
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server error during verification.' });
        }
    }
};

// --- MODIFIED: Export the functions correctly ---
module.exports = {
    initiateEsewaPayment,
    verifyEsewaPayment
};