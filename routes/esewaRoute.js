const express = require('express');
const { initiateEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');

const router = express.Router();

router.post('/initiate', initiateEsewaPayment);
router.get('/verify', verifyEsewaPayment);

module.exports = router; //
