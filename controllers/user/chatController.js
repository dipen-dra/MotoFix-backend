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
        console.error('User getUnreadCount Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const clearChatForUser = async (req, res) => {
    try {
        const userId = req.user.id; // From authenticateUser middleware
        const roomName = `chat-${userId}`;

        // Mark all messages in the user's room as cleared for them
        await Message.updateMany(
            { room: roomName },
            { $set: { clearedForUser: true } }
        );

        res.status(200).json({ success: true, message: 'Your chat history has been cleared.' });
    } catch (error) {
        console.error('User clearChatForUser Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUnreadCount,
    clearChatForUser
};