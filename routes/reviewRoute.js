const express = require('express');
const router = express.Router();

const { createServiceReview } = require('../controllers/reviewController');
const { authenticateUser } = require('../middlewares/authorizedUser');


router.route('/:bookingId').post(authenticateUser, createServiceReview);

module.exports = router;