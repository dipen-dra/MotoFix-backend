// const express = require('express');
// const router = express.Router();

// const { getUserBookings, createBooking, confirmPayment } = require('../../controllers/user/bookingController');
// const { authenticateUser } = require('../../middlewares/authorizedUser');

// router.route('/bookings')
//     .get(authenticateUser, getUserBookings)
//     .post(authenticateUser, createBooking);

// router.route('/bookings/:id/pay')
//     .put(authenticateUser, confirmPayment);

// module.exports = router;

const express = require('express');
const router = express.Router();

const { getUserBookings, createBooking, updateUserBooking, deleteUserBooking, confirmPayment } = require('../../controllers/user/bookingController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

router.route('/bookings')
    .get(authenticateUser, getUserBookings)
    .post(authenticateUser, createBooking);

router.route('/bookings/:id')
    .put(authenticateUser, updateUserBooking)
    .delete(authenticateUser, deleteUserBooking);

router.route('/bookings/:id/pay')
    .put(authenticateUser, confirmPayment);

module.exports = router;