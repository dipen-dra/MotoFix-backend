const express = require('express');

const {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBooking,
    generateBookingInvoice
} = require('../../controllers/admin/bookingController.js');

const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser.js');

const router = express.Router();

router.use(authenticateUser);

router.route('/')
    .get(getAllBookings);

router.route('/:id/invoice')
    .get(generateBookingInvoice);

router.route('/:id')
    .get(getBookingById)
    .put(updateBooking)
    .delete(deleteBooking);

module.exports = router;