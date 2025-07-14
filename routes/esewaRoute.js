// routes/esewaRoutes.js
const express = require('express');
const router = express.Router();

// Use require for the controller and destructure the exported functions
const { initiateEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');

router.post('/initiate', initiateEsewaPayment);
router.get('/verify', verifyEsewaPayment);

module.exports = router;