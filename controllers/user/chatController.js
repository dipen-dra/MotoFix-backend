// controllers/user/chatController.js

const Message = require('../../models/Message');

// @desc    Get the count of unread messages for the logged-in user.
// @route   GET /api/user/chat/unread-count
// @access  Private/User
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomName = `chat-${userId}`;

        // Count messages in the user's room that are unread and not sent by the user themselves.
        const count = await Message.countDocuments({
            room: roomName,
            isRead: false,
            authorId: { $ne: userId } // Count messages from admin
        });

        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread message count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUnreadCount
};