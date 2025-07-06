const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');

// POST route for chat, handles requests to /api/gemini/chat
router.post('/chat', geminiController.generateChatResponse);

module.exports = router;