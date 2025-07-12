const express = require('express');
const router = express.Router();

const { getAvailableServices, getServiceById } = require('../../controllers/user/serviceController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

// @route   GET /api/user/services
// @desc    Get all available services for users, optionally filtered by location/radius
// @access  Private
// NOTE: Renamed to just /services to handle location-based filtering via query params
router.get('/services', authenticateUser, getAvailableServices);

// @route   GET /api/user/services/:id
// @desc    Get a single service by ID for users
// @access  Private
router.get('/services/:id', authenticateUser, getServiceById);

module.exports = router;