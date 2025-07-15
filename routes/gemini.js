const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');


router.post('/chat', geminiController.generateChatResponse);

module.exports = router;