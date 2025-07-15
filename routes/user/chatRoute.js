const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../../middlewares/authorizedUser');

const { uploadChatFile } = require('../../controllers/admin/chatController');
const { clearChatForUser, getUnreadCount } = require('../../controllers/user/ChatController');

router.get('/unread-count', authenticateUser, getUnreadCount);

router.post('/upload', authenticateUser, uploadChatFile);

router.put('/clear', authenticateUser, clearChatForUser);
module.exports = router;