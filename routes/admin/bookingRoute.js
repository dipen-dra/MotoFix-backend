

// const express = require('express');
// const router = express.Router();

// const { 
//     getAllBookings, 
//     getBookingById,  
//     deleteBooking, 
//     updateBooking
// } = require('../../controllers/admin/bookingController');
// const { authenticateUser } = require('../../middlewares/authorizedUser');

// // GET all bookings
// // Matches /api/admin/bookings
// router.route('/')
//     .get(authenticateUser, getAllBookings);

// // GET a single booking by ID
// // DELETE a single booking by ID
// // Matches /api/admin/bookings/:id
// router.route('/:id')
//     .get(authenticateUser, getBookingById)
//     .delete(authenticateUser, deleteBooking);

// // PUT (update) a booking's status
// // Matches /api/admin/bookings/:id/status
// router.route('/:id')
//     .put(authenticateUser, updateBooking);

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

// Matches /api/admin/bookings
router.route('/')
    .get(authenticateUser, getAllBookings);

// Matches /api/admin/bookings/:id
// REFACTORED: Chained all methods for the same route together
router.route('/:id')
    .get(authenticateUser, getBookingById)
    .put(authenticateUser, updateBooking)
    .delete(authenticateUser, deleteBooking);

module.exports = router;