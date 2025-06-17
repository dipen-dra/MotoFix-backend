const express = require('express');
const router = express.Router();

const { getAvailableServices } = require('../../controllers/user/serviceController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

// @route   GET /api/user/services
router.get('/services', authenticateUser, getAvailableServices);

module.exports = router;
