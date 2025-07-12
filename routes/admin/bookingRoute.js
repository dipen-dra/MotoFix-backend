// routes/admin/bookingRoute.js

const express = require('express');
const {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBooking,
    generateBookingInvoice 
} = require('../../controllers/admin/bookingController.js');

const { authenticateUser, isWorkshopAdmin } = require('../../middlewares/authorizedUser.js'); // Use isWorkshopAdmin

const router = express.Router();

// Apply authentication middleware and workshop admin check to all routes in this file
router.use(authenticateUser, isWorkshopAdmin);

// Matches /api/admin/bookings/
router.route('/')
    .get(getAllBookings);

router.route('/:id/invoice')
    .get(generateBookingInvoice);

// Matches /api/admin/bookings/:id
router.route('/:id')
    .get(getBookingById)
    .put(updateBooking)
    .delete(deleteBooking);

module.exports = router;