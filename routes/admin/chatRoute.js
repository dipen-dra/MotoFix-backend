// routes/admin/chatRoute.js
const express = require('express');
const router = express.Router();
const { 
    getChatUsers, 
    uploadChatFile, 
    clearChatForAdmin 
} = require('../../controllers/admin/chatController');

const { authenticateUser, isWorkshopAdmin } = require('../../middlewares/authorizedUser');

router.get('/users', authenticateUser, isWorkshopAdmin, getChatUsers);
router.post('/upload', authenticateUser, isWorkshopAdmin, uploadChatFile);
router.put('/clear/:userId', authenticateUser, isWorkshopAdmin, clearChatForAdmin);

module.exports = router;