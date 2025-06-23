// const express = require('express');
// const router = express.Router();

// const { getUserBookings, createBooking } = require('../../controllers/user/bookingController');
// const { authenticateUser } = require('../../middlewares/authorizedUser');

// router.route('/bookings')
//     .get(authenticateUser, getUserBookings)
//     .post(authenticateUser, createBooking);

// module.exports = router;
// // This code sets up routes for user bookings.
// // It includes a GET route to fetch user bookings and a POST route to create a new booking

const express = require('express');
const router = express.Router();

const { getUserBookings, createBooking, confirmPayment } = require('../../controllers/user/bookingController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

module.exports = router;