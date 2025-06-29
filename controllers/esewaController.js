// import crypto from 'crypto';
// import fetch from 'node-fetch';
// import Booking from '../models/Booking.js';
// import User from '../models/User.js';
// import sendEmail from '../utils/sendEmail.js'; // <-- IMPORTED: Email utility

// const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
// const ESEWA_SCD = 'EPAYTEST';
// const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// // Helper function to award loyalty points
// const awardLoyaltyPoints = async (userId) => {
//     const user = await User.findById(userId);
//     if (user) {
//         const pointsToAdd = Math.floor(Math.random() * 11) + 10; // 10 to 20 points
//         user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
//         await user.save();
//         return pointsToAdd;
//     }
//     return 0;
// };

// export const initiateEsewaPayment = async (req, res) => {
//     try {
//         const { bookingId } = req.body;
//         const booking = await Booking.findById(bookingId);

//         if (!booking) return res.status(404).json({ message: 'Booking not found' });
//         if (booking.totalCost == null) return res.status(400).json({ message: 'Booking does not have a totalCost.' });

//         const signedFieldNames = 'total_amount,transaction_uuid,product_code';
//         const signatureBaseString = `total_amount=${booking.totalCost},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;
//         const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
//         hmac.update(signatureBaseString);
//         const signature = hmac.digest('base64');

//         const esewaData = {
//             amount: booking.totalCost.toString(),
//             // The success URL points to your React component, which is correct.
//             success_url: `http://localhost:5173/payment/esewa/success`,
//             failure_url: 'http://localhost:5173/payment/esewa/failure',
//             product_delivery_charge: '0',
//             product_service_charge: '0',
//             product_code: ESEWA_SCD,
//             signature,
//             signed_field_names: signedFieldNames,
//             tax_amount: '0',
//             total_amount: booking.totalCost.toString(),
//             transaction_uuid: bookingId,
//         };

//         res.json({ ...esewaData, ESEWA_URL });
//     } catch (error) {
//         console.error('Error in initiateEsewaPayment:', error);
//         res.status(500).json({ message: 'Server Error while initiating payment' });
//     }
// };

// /**
//  * @desc      Verify an eSewa payment and send confirmation email
//  * @route     GET /api/payment/esewa/verify
//  * @access    Private (Implicitly, via frontend ProtectedRoute)
//  */
// export const verifyEsewaPayment = async (req, res) => {
//     try {
//         const { data } = req.query;
//         if (!data) {
//             return res.status(400).json({ success: false, message: 'No data provided for verification' });
//         }

//         const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

//         if (decodedData.status !== 'COMPLETE') {
//             return res.status(400).json({ success: false, message: `Payment not complete. Status: ${decodedData.status}` });
//         }

//         const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;

//         const response = await fetch(verificationUrl);
//         const verificationResponse = await response.json();

//         if (verificationResponse.status === 'COMPLETE') {
//             // Find booking and populate customer info for the email
//             const booking = await Booking.findById(decodedData.transaction_uuid).populate('customer', 'fullName email');

//             if (!booking) {
//                 return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
//             }

//             // If already paid, just return a success message. No points or email needed again.
//             if (booking.isPaid) {
//                 return res.status(200).json({ success: true, message: 'Payment was already verified.' });
//             }

//             booking.paymentStatus = 'Paid';
//             booking.paymentMethod = 'eSewa';
//             booking.isPaid = true;
//             await booking.save();

//             const points = await awardLoyaltyPoints(booking.customer._id);

//             // --- SEND JSON RESPONSE TO FRONTEND ---
//             // Your EsewaSuccess component is waiting for this JSON response.
//             res.status(200).json({ success: true, message: `Payment successful! You earned ${points} loyalty points.` });

//             // --- SEND EMAIL NOTIFICATION IN THE BACKGROUND ---
//             try {
//                 const emailHtml = `
//                     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//                         <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
//                             <img src="cid:logo" alt="MotoFix Logo" style="width: 150px;"/>
//                             <h2 style="color: #2c3e50;">Payment Successful!</h2>
//                         </div>
//                         <div style="padding: 20px;">
//                             <p>Dear ${booking.customer.fullName},</p>
//                             <p>Your payment for booking <strong>#${booking._id}</strong> has been successfully processed via eSewa.</p>
//                             <p>Your appointment for <strong>${booking.serviceType}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> is confirmed.</p>
//                             <p>Total Amount Paid: <strong>Rs. ${booking.finalAmount} via Esewa </strong></p>
//                             <p>Thank you for choosing MotoFix!</p>
//                         </div>
//                         <hr/>
//                         <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply.</p>
//                     </div>
//                 `;
//                 const attachments = [{
//                     filename: 'logo.png',
//                     path: 'https://pplx-res.cloudinary.com/image/upload/v1751135827/gpt4o_images/pdlz3nvtduzpqhnkuova.png', // Using a consistent logo path
//                     cid: 'logo'
//                 }];
//                 await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml, attachments);
//             } catch (emailError) {
//                 console.error("Error sending eSewa success email:", emailError);
//                 // The response has already been sent, so we just log the error.
//             }

//         } else {
//             res.status(400).json({ success: false, message: 'eSewa payment verification failed' });
//         }
//     } catch (error) {
//         console.error('Error in verifyEsewaPayment:', error);
//         if (!res.headersSent) {
//             res.status(500).json({ success: false, message: 'Server error during verification.' });
//         }
//     }
// };




import crypto from 'crypto';
import fetch from 'node-fetch';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// --- Icon URL for direct use in email HTML ---
// --- Icon URLs for direct use in email HTML for better reliability ---
const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg'; // Green tick icon
const CANCEL_ICON_URL = 'https://media.istockphoto.com/id/1132722548/vector/round-red-x-mark-line-icon-button-cross-symbol-on-white-background.jpg?s=612x612&w=0&k=20&c=QnHlhWesKpmbov2MFn2yAMg6oqDS8YXmC_iDsPK_BXQ=';  // Red cross icon
// Green tick icon

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

export const initiateEsewaPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        // Use finalAmount for payment initiation as it includes discounts
        if (booking.finalAmount == null) return res.status(400).json({ message: 'Booking does not have a final amount to pay.' });

        // IMPORTANT: eSewa requires total_amount to be the same in signature and form data.
        const amountToPay = booking.finalAmount.toString();
        
        const signedFieldNames = 'total_amount,transaction_uuid,product_code';
        const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;
        
        const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
        hmac.update(signatureBaseString);
        const signature = hmac.digest('base64');

        const esewaData = {
            amount: amountToPay,
            success_url: `http://localhost:5173/payment/esewa/success`,
            failure_url: 'http://localhost:5173/payment/esewa/failure',
            product_delivery_charge: '0',
            product_service_charge: '0',
            product_code: ESEWA_SCD,
            signature,
            signed_field_names: signedFieldNames,
            tax_amount: '0',
            total_amount: amountToPay,
            transaction_uuid: bookingId,
        };

        res.json({ ...esewaData, ESEWA_URL });
    } catch (error) {
        console.error('Error in initiateEsewaPayment:', error);
        res.status(500).json({ message: 'Server Error while initiating payment' });
    }
};

/**
 * @desc      Verify an eSewa payment and send confirmation email
 * @route     GET /api/payment/esewa/verify
 * @access    Private (Implicitly, via frontend ProtectedRoute)
 */
export const verifyEsewaPayment = async (req, res) => {
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
            const booking = await Booking.findById(decodedData.transaction_uuid).populate('customer', 'fullName email');

            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found after payment.' });
            }
            if (booking.isPaid) {
                return res.status(200).json({ success: true, message: 'Payment was already verified.' });
            }

            booking.paymentStatus = 'Paid';
            booking.paymentMethod = 'eSewa';
            booking.isPaid = true;
            await booking.save();

            const points = await awardLoyaltyPoints(booking.customer._id);
            res.status(200).json({ success: true, message: `Payment successful! You earned ${points} loyalty points.` });

            // --- SEND EMAIL NOTIFICATION IN THE BACKGROUND ---
            try {
                // UPDATED: Use direct icon URL and remove attachments
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
                            <img src="${SUCCESS_ICON_URL}" alt="Success Icon" style="width: 80px;"/>
                            <h2 style="color: #2c3e50;">Payment Successful!</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Dear ${booking.customer.fullName},</p>
                            <p>Your payment for booking <strong>#${booking._id}</strong> has been successfully processed via eSewa.</p>
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