// routes/user/serviceRoutes.js
const express = require('express');
const router = express.Router();

const { getAvailableServices, getServiceById } = require('../../controllers/user/serviceController');
const { authenticateUser } = require('../../middlewares/authorizedUser'); // Corrected middleware name

// @route    GET /api/user/services
// @desc     Get all available services for users
// @access   Private
router.get('/services', authenticateUser, getAvailableServices);

// @route    GET /api/user/services/:id
// @desc     Get a single service by ID for users
// @access   Private
router.get('/services/:id', authenticateUser, getServiceById);

module.exports = router;