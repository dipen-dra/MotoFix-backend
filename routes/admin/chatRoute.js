const express = require('express');
const router = express.Router();
const { 
    getChatUsers, 
    uploadChatFile, 
    clearChatForAdmin 
} = require('../../controllers/admin/chatController');

const { authenticateUser, isWorkshopAdmin } = require('../../middlewares/authorizedUser'); // Use isWorkshopAdmin

// This route gets all user conversations for the admin panel
router.get('/users', authenticateUser, isWorkshopAdmin, getChatUsers);

// This route handles file uploads specifically from the admin
router.post('/upload', authenticateUser, isWorkshopAdmin, uploadChatFile);

// The route to clear chat for admin
router.put('/clear/:userId', authenticateUser, isWorkshopAdmin, clearChatForAdmin);

module.exports = router;