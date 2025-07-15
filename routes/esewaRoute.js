// routes/esewaRoutes.js
const express = require('express');
const router = express.Router();


const { initiateEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');

router.post('/initiate', initiateEsewaPayment);
router.get('/verify', verifyEsewaPayment);

module.exports = router;