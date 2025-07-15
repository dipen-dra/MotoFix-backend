const express = require('express');
const router = express.Router();
const { 
    getChatUsers, 
    uploadChatFile, 
    clearChatForAdmin 
} = require('../../controllers/admin/chatController');

const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser');

router.get('/users', authenticateUser, isAdmin, getChatUsers);

router.post('/upload', authenticateUser, isAdmin, uploadChatFile);

router.put('/clear/:userId', authenticateUser, isAdmin, clearChatForAdmin);

module.exports = router;