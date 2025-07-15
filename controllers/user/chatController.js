const Message = require('../../models/Message');

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomName = `chat-${userId}`;

        const count = await Message.countDocuments({
            room: roomName,
            isRead: false,
            authorId: { $ne: userId }
        });

        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread message count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
const clearChatForUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomName = `chat-${userId}`;

        await Message.updateMany(
            { room: roomName },
            { $set: { clearedForUser: true } }
        );

        res.status(200).json({ success: true, message: 'Your chat history has been cleared.' });
    } catch (error) {
        console.error('Error clearing chat for user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUnreadCount,
    clearChatForUser
};