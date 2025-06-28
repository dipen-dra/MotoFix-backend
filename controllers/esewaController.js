// Filename: controllers/paymentController.js (or wherever your code is)

import crypto from 'crypto';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import fetch from 'node-fetch';
import sendEmail from '../utils/sendEmail.js';

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// Award random loyalty points between 10–20
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

// ==========================================================
// UPDATED FUNCTION
// ==========================================================
export const initiateEsewaPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.totalCost == null) return res.status(400).json({ message: 'Booking does not have a totalCost.' });

        const signedFieldNames = 'total_amount,transaction_uuid,product_code';
        const signatureBaseString = `total_amount=${booking.totalCost},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;
        const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
        hmac.update(signatureBaseString);
        const signature = hmac.digest('base64');

        const esewaData = {
            amount: booking.totalCost.toString(),
            failure_url: 'http://localhost:5173/#/user/my-payments?status=failure',
            product_delivery_charge: '0',
            product_service_charge: '0',
            product_code: ESEWA_SCD,
            signature,
            signed_field_names: signedFieldNames,

            // ✅ CORRECTED: This URL now points directly to your backend verification endpoint.
            // eSewa will redirect the user's browser here after payment.
            success_url: `http://localhost:5050/api/payment/esewa/verify`,

            tax_amount: '0',
            total_amount: booking.totalCost.toString(),
            transaction_uuid: bookingId,
        };

        res.json({ ...esewaData, ESEWA_URL });
    } catch (error) {
        console.error('Error in initiateEsewaPayment:', error);
        res.status(500).json({ message: 'Server Error while initiating payment' });
    }
};


// ==========================================================
// THIS FUNCTION IS ALREADY CORRECT - NO CHANGES NEEDED
// ==========================================================
export const verifyEsewaPayment = async (req, res) => {
    try {
        const { data } = req.query;
        if (!data) return res.status(400).json({ message: 'No data provided for verification' });
        
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        if (decodedData.status !== 'COMPLETE') {
            return res.redirect('http://localhost:5173/#/user/my-payments?status=failure&message=Payment not complete');
        }

        const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        
        const response = await fetch(verificationUrl);
        const verificationResponse = await response.json();

        if (verificationResponse.status === 'COMPLETE') {
            const booking = await Booking.findById(decodedData.transaction_uuid).populate('customer', 'fullName email');
            if (booking && !booking.isPaid) {
                booking.paymentStatus = 'Paid';
                booking.paymentMethod = 'eSewa';
                booking.isPaid = true;
                await booking.save();
                
                const points = await awardLoyaltyPoints(booking.customer._id);

                // --- REDIRECT USER IMMEDIATELY ---
                res.redirect(`http://localhost:5173/#/user/my-payments?status=success&message=Payment successful! You earned ${points} points.`);

                // --- SEND EMAIL NOTIFICATION IN THE BACKGROUND ---
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
                                <p>Total Amount Paid: <strong>Rs. ${booking.totalCost}</strong></p>
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
                    console.error("Error sending eSewa success email:", emailError);
                }
                
                return; // End execution after redirecting and starting email process
            }
             // If already paid, just redirect without awarding points again
            return res.redirect('http://localhost:5173/#/user/my-payments?status=success&message=Payment already verified.');

        } else {
            return res.redirect('http://localhost:5173/#/user/my-payments?status=failure&message=Payment verification failed');
        }
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        if (!res.headersSent) {
            return res.redirect(`http://localhost:5173/#/user/my-payments?status=failure&message=Server error during verification`);
        }
    }
};