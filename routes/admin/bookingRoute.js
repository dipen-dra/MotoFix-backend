const express = require("express");
const router = express.Router();
const { getBookings, updateBooking, deleteBooking } = require("../../controllers/admin/bookingController");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

router.get("/", authenticateUser, isAdmin, getBookings);
router.put("/:id", authenticateUser, isAdmin, updateBooking);
router.delete("/:id", authenticateUser, isAdmin, deleteBooking);

module.exports = router;