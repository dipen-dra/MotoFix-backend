const express = require('express');
const router = express.Router();
const { 
    getChatUsers, 
    uploadChatFile, 
    clearChatForAdmin 
} = require('../../controllers/admin/chatController');

// ⭐️ FIX: Use the correct authorization middleware file and functions.
// This should match what your other working admin routes use.
const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser');

// This route gets all user conversations for the admin panel
router.get('/users', authenticateUser, isAdmin, getChatUsers);

// This route handles file uploads specifically from the admin
router.post('/upload', authenticateUser, isAdmin, uploadChatFile);

// The route to clear chat for admin
router.put('/clear/:userId', authenticateUser, isAdmin, clearChatForAdmin);

module.exports = router;