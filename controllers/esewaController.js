// import crypto from 'crypto';
// import Booking from '../models/Booking.js';
// import fetch from 'node-fetch';

// const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
// const ESEWA_SCD = 'EPAYTEST';
// const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// export const initiateEsewaPayment = async (req, res) => {
//   try {
//     const { bookingId } = req.body;
//     const booking = await Booking.findById(bookingId);

//     if (!booking) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }
    
//     if (booking.totalCost == null) {
//       return res.status(400).json({ message: 'Booking does not have a totalCost.' });
//     }

//     const signedFieldNames = 'total_amount,transaction_uuid,product_code';
//     const signatureBaseString = `total_amount=${booking.totalCost},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;

//     const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
//     hmac.update(signatureBaseString);
//     const signature = hmac.digest('base64');

//     const esewaData = {
//       amount: booking.totalCost.toString(),
//       failure_url: 'http://localhost:5173/payment/esewa/failure',
//       product_delivery_charge: '0',
//       product_service_charge: '0',
//       product_code: ESEWA_SCD,
//       signature: signature,
//       signed_field_names: signedFieldNames,
//       success_url: 'http://localhost:5173/payment/esewa/success',
//       tax_amount: '0',
//       total_amount: booking.totalCost.toString(),
//       transaction_uuid: bookingId,
//     };
    
//     res.json({ ...esewaData, ESEWA_URL });

//   } catch (error) {
//     console.error('Error in initiateEsewaPayment:', error);
//     res.status(500).json({ message: 'Server Error while initiating payment' });
//   }
// };

// export const verifyEsewaPayment = async (req, res) => {
//     try {
//         const { data } = req.query;
//         if (!data) {
//             return res.status(400).json({ message: 'No data provided for verification' });
//         }
//         const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
//         if (decodedData.status !== 'COMPLETE') {
//             return res.status(400).json({ message: 'Payment not complete' });
//         }

//         const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        
//         const response = await fetch(verificationUrl);
//         const verificationResponse = await response.json();

//         if (verificationResponse.status === 'COMPLETE') {
//             const booking = await Booking.findById(decodedData.transaction_uuid);
//             if (booking) {
//                 booking.paymentStatus = 'Paid';
//                 booking.paymentMethod = 'eSewa';
//                 booking.isPaid=true;
//                 await booking.save();
//             }
//             res.json({ success: true, message: 'Payment verified successfully' });
//         } else {
//             res.status(400).json({ success: false, message: 'Payment verification failed' });
//         }
//     } catch (error) {
//         console.error('Error in verifyEsewaPayment:', error);
//         // MODIFICATION: Send the actual error message to the frontend
//         res.status(500).json({ 
//             success: false, 
//             message: 'Server Error during verification. See error details.',
//             error: error.message 
//         });
//     }
// };
// controllers/payment/esewaController.js
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import User from '../models/User.js'; // Import User model
import fetch from 'node-fetch';

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// Helper function to award loyalty points
const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        const pointsToAdd = Math.floor(Math.random() * 11) + 10; // 10 to 50
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
            success_url: `http://localhost:5173/payment/esewa/success`, // The backend route will handle this
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
            const booking = await Booking.findById(decodedData.transaction_uuid);
            if (booking && !booking.isPaid) {
                booking.paymentStatus = 'Paid';
                booking.paymentMethod = 'eSewa';
                booking.isPaid = true;
                await booking.save();
                
                const points = await awardLoyaltyPoints(booking.customer);
                // Redirect to a success page on the frontend
                return res.redirect(`http://localhost:5173/#/user/my-payments?status=success&message=Payment successful! You earned ${points} points.`);
            }
             // If already paid, just redirect without awarding points again
            return res.redirect('http://localhost:5173/#/user/my-payments?status=success&message=Payment already verified.');

        } else {
            return res.redirect('http://localhost:5173/#/user/my-payments?status=failure&message=Payment verification failed');
        }
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        return res.redirect(`http://localhost:5173/#/user/my-payments?status=failure&message=Server error during verification`);
    }
};