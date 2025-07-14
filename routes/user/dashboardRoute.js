const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../../controllers/user/dashboardController');
const { authenticateUser } = require('../../middlewares/authorizedUser');
const { getUnreadCount } = require('../../controllers/user/chatController');

router.get('/dashboard-summary', authenticateUser, getDashboardSummary);
router.get('/chat/unread-count', authenticateUser, getUnreadCount);

module.exports = router;
