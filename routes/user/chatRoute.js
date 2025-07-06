const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../../middlewares/authorizedUser');

// It's perfectly fine to re-use this controller. It's designed to be generic.
const { uploadChatFile } = require('../../controllers/admin/chatController'); 
const { getUnreadCount, clearChatForUser } = require('../../controllers/user/ChatController');

// 1. Corrected the filename from ChatController to chatController (assuming that's the real file name)

// @route   GET /api/user/chat/unread-count
// @desc    Get the number of unread messages for the logged-in user
router.get('/unread-count', authenticateUser, getUnreadCount);

// @route   POST /api/user/chat/upload
// @desc    Handles file uploads from the user. It is protected by authenticateUser,
//          so only a logged-in user can access it.
router.post('/upload', authenticateUser, uploadChatFile);

router.put('/clear', authenticateUser, clearChatForUser);
module.exports = router;