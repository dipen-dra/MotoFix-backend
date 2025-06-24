import crypto from 'crypto';
import Booking from '../models/Booking.js';
import fetch from 'node-fetch';

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST';
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

export const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // FIX: Use totalCost instead of totalPrice
    if (booking.totalCost == null) {
      return res.status(400).json({ message: 'Booking does not have a totalCost.' });
    }

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';

    // FIX: Use totalCost instead of totalPrice
    const signatureBaseString = `total_amount=${booking.totalCost},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;

    const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
    hmac.update(signatureBaseString);
    const signature = hmac.digest('base64');

    const esewaData = {
      // FIX: Use totalCost instead of totalPrice
      amount: booking.totalCost.toString(),
      failure_url: 'http://localhost:5173/payment/esewa/failure',
      product_delivery_charge: '0',
      product_service_charge: '0',
      product_code: ESEWA_SCD,
      signature: signature,
      signed_field_names: signedFieldNames,
      success_url: 'http://localhost:5173/payment/esewa/success',
      tax_amount: '0',
      // FIX: Use totalCost instead of totalPrice
      total_amount: booking.totalCost.toString(),
      transaction_uuid: bookingId,
    };
    
    console.log('Signature Base String:', signatureBaseString);
    console.log('Generated Signature:', signature);

    res.json({ ...esewaData, ESEWA_URL });

  } catch (error) {
    console.error('Error in initiateEsewaPayment:', error);
    res.status(500).json({ message: 'Server Error while initiating payment' });
  }
};

export const verifyEsewaPayment = async (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ message: 'No data provided for verification' });
        }
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        if (decodedData.status !== 'COMPLETE') {
            return res.status(400).json({ message: 'Payment not complete' });
        }

        const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=EPAYTEST&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        
        const response = await fetch(verificationUrl);
        const verificationResponse = await response.json();

        if (verificationResponse.status === 'COMPLETE') {
            const booking = await Booking.findById(decodedData.transaction_uuid);
            if (booking) {
                booking.paymentStatus = 'paid';
                booking.paymentMethod = 'eSewa';
                await booking.save();
            }
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        res.status(500).json({ success: false, message: 'Server Error during verification' });
    }
};