// routes/admin/chatRoute.js
const express = require('express');
const router = express.Router();
const { getChatUsers, uploadChatFile } = require('../../controllers/admin/chatController');
const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser');

// This route gets all user conversations for the admin panel
router.get('/users', authenticateUser, isAdmin, getChatUsers);

// This route handles file uploads from both admin and users
// We can use the same controller logic for both
router.post('/upload', authenticateUser, uploadChatFile);

module.exports = router;