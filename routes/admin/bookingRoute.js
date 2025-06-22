// const express = require("express");
// const router = express.Router();
// const { getBookings, updateBooking, deleteBooking } = require("../../controllers/admin/bookingController");
// const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

// router.get("/", authenticateUser, isAdmin, getBookings);
// router.put("/:id", authenticateUser, isAdmin, updateBooking);
// router.delete("/:id", authenticateUser, isAdmin, deleteBooking);

// module.exports = router;


// const express = require("express");
// const router = express.Router();
// // --- FIX: Import the getBooking function ---
// const { getBookings, getBooking, updateBooking, deleteBooking } = require("../../controllers/admin/bookingController");
// const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

// // Gets all bookings
// router.get("/", authenticateUser, isAdmin, getBookings);

// // --- FIX: Add this route for getting a single booking by ID ---
// router.get("/:id", authenticateUser, isAdmin, getBooking);

// // Updates a booking
// router.put("/:id", authenticateUser, isAdmin, updateBooking);

// // Deletes a booking
// router.delete("/:id", authenticateUser, isAdmin, deleteBooking);

// module.exports = router;


const express = require('express');
const router = express.Router();

const { 
    getAllBookings, 
    getBookingById,  
    deleteBooking, 
    updateBooking
} = require('../../controllers/admin/bookingController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

// GET all bookings
// Matches /api/admin/bookings
router.route('/')
    .get(authenticateUser, getAllBookings);

// GET a single booking by ID
// DELETE a single booking by ID
// Matches /api/admin/bookings/:id
router.route('/:id')
    .get(authenticateUser, getBookingById)
    .delete(authenticateUser, deleteBooking);

// PUT (update) a booking's status
// Matches /api/admin/bookings/:id/status
router.route('/:id')
    .put(authenticateUser, updateBooking);

module.exports = router;