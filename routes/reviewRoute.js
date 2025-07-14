const express = require('express');
const router = express.Router();

// Correctly import using require and destructuring
const { createServiceReview } = require('../controllers/reviewController');
const { authenticateUser } = require('../middlewares/authorizedUser');

// @route   POST /api/reviews/:bookingId
// @desc    Add a new review to a service associated with a specific booking
// @access  Private
router.route('/:bookingId').post(authenticateUser, createServiceReview);

module.exports = router;