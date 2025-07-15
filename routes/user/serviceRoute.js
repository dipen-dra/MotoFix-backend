// routes/user/serviceRoutes.js
const express = require('express');
const router = express.Router();

const { getAvailableServices, getServiceById } = require('../../controllers/user/serviceController');
const { authenticateUser } = require('../../middlewares/authorizedUser'); // Corrected middleware name


router.get('/services', authenticateUser, getAvailableServices);


router.get('/services/:id', authenticateUser, getServiceById);

module.exports = router;