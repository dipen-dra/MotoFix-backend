// const express = require("express");
// const router = express.Router();
// const { getBookings, updateBooking, deleteBooking } = require("../../controllers/admin/bookingController");
// const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

// router.get("/", authenticateUser, isAdmin, getBookings);
// router.put("/:id", authenticateUser, isAdmin, updateBooking);
// router.delete("/:id", authenticateUser, isAdmin, deleteBooking);

// module.exports = router;


const express = require("express");
const router = express.Router();
// --- FIX: Import the getBooking function ---
const { getBookings, getBooking, updateBooking, deleteBooking } = require("../../controllers/admin/bookingController");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

// Gets all bookings
router.get("/", authenticateUser, isAdmin, getBookings);

// --- FIX: Add this route for getting a single booking by ID ---
router.get("/:id", authenticateUser, isAdmin, getBooking);

// Updates a booking
router.put("/:id", authenticateUser, isAdmin, updateBooking);

// Deletes a booking
router.delete("/:id", authenticateUser, isAdmin, deleteBooking);

module.exports = router;