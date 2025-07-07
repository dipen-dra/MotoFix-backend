// routes/user/chatRoute.js

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../../middlewares/authorizedUser');
const { uploadChatFile } = require('../../controllers/admin/chatController'); // Re-using this controller
const { getUnreadCount } = require('../../controllers/user/chatController');

// @route   GET /api/user/chat/unread-count
// @desc    Get the number of unread messages for the logged-in user
router.get('/unread-count', authenticateUser, getUnreadCount);

// @route   POST /api/user/chat/upload
// @desc    Handles file uploads from the user
router.post('/upload', authenticateUser, uploadChatFile);


module.exports = router;