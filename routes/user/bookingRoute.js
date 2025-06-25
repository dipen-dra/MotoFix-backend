
// routes/user/bookingRoute.js
const express = require('express');
const router = express.Router();

const { 
    getUserBookings, 
    createBooking, 
    updateUserBooking, 
    deleteUserBooking, 
    confirmPayment,
    verifyKhaltiPayment,
    applyLoyaltyDiscount // --- IMPORT NEW FUNCTION ---
} = require('../../controllers/user/bookingController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

router.route('/bookings/:id')
    .put(authenticateUser, updateUserBooking)
    .delete(authenticateUser, deleteUserBooking);

router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

// --- NEW ROUTE ---
router.route('/bookings/:id/apply-discount')
    .put(authenticateUser, applyLoyaltyDiscount);

// New route for Khalti verification in test mode
router.route('/bookings/verify-khalti')
    .post(authenticateUser, verifyKhaltiPayment);

module.exports = router;