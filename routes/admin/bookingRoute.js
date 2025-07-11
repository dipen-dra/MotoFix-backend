import express from 'express';
import {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBooking,
    generateBookingInvoice // <-- Import the new function
} from '../../controllers/admin/bookingController.js';
import { authenticateUser, isAdmin } from '../../middlewares/authorizedUser.js'; // Assuming you have an isAdmin middleware

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(authenticateUser);
// Optional: If you have an isAdmin middleware, apply it as well
// router.use(isAdmin); 

// Matches /api/admin/bookings/
router.route('/')
    .get(getAllBookings);

// --- NEW INVOICE ROUTE ---
// This must come BEFORE the general '/:id' route
router.route('/:id/invoice')
    .get(generateBookingInvoice);

// Matches /api/admin/bookings/:id
router.route('/:id')
    .get(getBookingById)
    .put(updateBooking)
    .delete(deleteBooking);

export default router;