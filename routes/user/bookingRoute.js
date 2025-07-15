// routes/user/bookingRoutes.js
const express = require('express');
const router = express.Router();

const { 
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
} = require('../../controllers/user/bookingController');

const { authenticateUser } = require('../../middlewares/authorizedUser');

router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

router.route('/bookings/pending').get(authenticateUser, getPendingBookings);
router.route('/bookings/history').get(authenticateUser, getBookingHistory);

router.route('/bookings/:id')
    .get(authenticateUser, getUserBookingById) 
    .put(authenticateUser, updateUserBooking)
    .delete(authenticateUser, deleteUserBooking);

router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

router.route('/bookings/:id/apply-discount')
    .put(authenticateUser, applyLoyaltyDiscount);

router.route('/bookings/verify-khalti')
    .post(authenticateUser, verifyKhaltiPayment);

module.exports = router;