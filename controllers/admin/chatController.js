const mongoose = require('mongoose');
const Message = require('../../models/Message');
const User = require('../../models/User');

// @desc    Get a list of users who have sent messages, with the latest message for each.
// @route   GET /api/admin/chat/users
// @access  Private/Admin
const getChatUsers = async (req, res) => {
    try {
        // Get all distinct room names from the messages collection
        const rooms = await Message.distinct('room');

        // 💡 **FIX**: Filter rooms to only include valid user chat rooms.
        // This prevents trying to process old/invalid room names like "support_chat".
        const userIds = rooms
            .filter(room => room.startsWith('chat-')) // 1. Ensure it's a user chat room
            .map(room => room.replace('chat-', ''))   // 2. Extract the ID part
            .filter(id => mongoose.Types.ObjectId.isValid(id)); // 3. Ensure it's a valid ObjectId

        if (userIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const users = await User.find({ _id: { $in: userIds } }).select('fullName email profilePicture');

        // Get the last message for each user to show a snippet and for sorting
        const lastMessages = await Promise.all(
            users.map(async (user) => {
                const lastMessage = await Message.findOne({ room: `chat-${user._id}` })
                    .sort({ timestamp: -1 })
                    .limit(1);
                return {
                    ...user.toObject(),
                    lastMessage: lastMessage ? lastMessage.message : 'No messages yet.',
                    lastMessageTimestamp: lastMessage ? lastMessage.timestamp : new Date(0)
                };
            })
        );

        // Sort users by the timestamp of their last message in descending order
        lastMessages.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));

        res.json({ success: true, data: lastMessages });
    } catch (error) {
        console.error('Error fetching chat users:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching chat users.' });
    }
};

module.exports = {
    getChatUsers
};
