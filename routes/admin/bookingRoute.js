// routes/admin/bookingRoute.js (Corrected)

// --- CORRECTED: Use require ---
const express = require('express');

// --- CORRECTED: Use require to get the controller functions ---
const {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBooking,
    generateBookingInvoice // <-- Your new function is correctly imported
} = require('../../controllers/admin/bookingController.js');

// --- CORRECTED: Use require for middleware ---
const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser.js');

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(authenticateUser);
// Optional: If you have an isAdmin middleware, apply it as well
// router.use(isAdmin); 

// Matches /api/admin/bookings/
router.route('/')
    .get(getAllBookings);

// --- NEW INVOICE ROUTE ---
// This order is correct: The specific '/invoice' route comes BEFORE the general '/:id' route
router.route('/:id/invoice')
    .get(generateBookingInvoice);

// Matches /api/admin/bookings/:id
router.route('/:id')
    .get(getBookingById)
    .put(updateBooking)
    .delete(deleteBooking);

// --- CORRECTED: Use module.exports ---
module.exports = router;