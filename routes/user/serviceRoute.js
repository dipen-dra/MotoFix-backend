const express = require('express');
const router = express.Router();

const { getAvailableServices, getServiceById } = require('../../controllers/user/serviceController');
// Note: Ensure you have a middleware to authenticate users.
// I'm using 'isAuthenticated' as a placeholder based on our previous discussion.
// Replace with 'authenticateUser' if that is the correct name in your project.
const { authenticateUser } = require('../../middlewares/authorizedUser');

// @route    GET /api/user/services
// @desc     Get all available services for users
// @access   Private
router.get('/services', authenticateUser, getAvailableServices);

// @route    GET /api/user/services/:id
// @desc     Get a single service by ID for users
// @access   Private
router.get('/services/:id', authenticateUser, getServiceById);


module.exports = router;