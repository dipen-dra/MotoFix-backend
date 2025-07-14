// routes/user/bookingRoutes.js
const express = require('express');
const router = express.Router();

// --- MODIFICATION: Import all necessary functions ---
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
} = require('../../controllers/user/bookingController'); // Ensure this path is correct

const { authenticateUser } = require('../../middlewares/authorizedUser'); // Ensure this path is correct

// This is now the main paginated route for the "My Bookings" page
router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

// --- NEW ROUTES for the "My Payments" page ---
router.route('/bookings/pending').get(authenticateUser, getPendingBookings);
router.route('/bookings/history').get(authenticateUser, getBookingHistory);

// --- MODIFICATION: Added GET method for the "Edit Booking" page ---
router.route('/bookings/:id')
    .get(authenticateUser, getUserBookingById) 
    .put(authenticateUser, updateUserBooking)
    .delete(authenticateUser, deleteUserBooking);

// --- Existing Routes (Unchanged) ---
router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

router.route('/bookings/:id/apply-discount')
    .put(authenticateUser, applyLoyaltyDiscount);

router.route('/bookings/verify-khalti')
    .post(authenticateUser, verifyKhaltiPayment);

module.exports = router;