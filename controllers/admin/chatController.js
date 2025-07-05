const mongoose = require('mongoose');
const Message = require('../../models/Message');
const User = require('../../models/User');

// @desc    Get a list of users who have sent messages, with the latest message and unread count for each.
// @route   GET /api/admin/chat/users
// @access  Private/Admin
const getChatUsers = async (req, res) => {
    try {
        const pipeline = [
            // 1. Sort all messages to easily find the latest one
            { $sort: { timestamp: -1 } },
            // 2. Group by conversation room
            {
                $group: {
                    _id: '$room',
                    lastMessageDoc: { $first: '$$ROOT' }, // Get the whole last message document
                    // Count unread messages for the admin
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isRead', false] },
                                        // An unread message for an admin is one NOT sent by an admin
                                        { $ne: ['$authorId', 'admin_user'] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    }
                }
            },
            // 3. Reshape the data and extract user ID from the room name
            {
                $project: {
                    _id: 0,
                    room: '$_id',
                    lastMessage: '$lastMessageDoc.message',
                    lastMessageTimestamp: '$lastMessageDoc.timestamp',
                    unreadCount: 1,
                    // Extract user ID from 'chat-USERID' format
                    userId: {
                       $let: {
                           vars: { parts: { $split: ['$_id', '-'] } },
                           in: { $arrayElemAt: ['$$parts', 1] }
                       }
                    }
                }
            },
            // 4. Ensure the extracted ID is a valid 24-character hex string before converting
             {
                $match: {
                    userId: { $regex: /^[0-9a-fA-F]{24}$/ }
                }
            },
            // 5. Convert the userId string to a valid ObjectId for the lookup
            {
                $addFields: {
                    userIdObj: { $toObjectId: '$userId' }
                }
            },
            // 6. Join with the User collection to get user details
            {
                $lookup: {
                    from: 'users',
                    localField: 'userIdObj',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            // 7. Filter out conversations where the user might have been deleted
            { $match: { userDetails: { $ne: [] } } },
            // 8. Deconstruct the userDetails array to a single object
            { $unwind: '$userDetails' },
            // 9. Shape the final output for the frontend
            {
                $project: {
                    _id: '$userDetails._id',
                    fullName: '$userDetails.fullName',
                    email: '$userDetails.email',
                    profilePicture: '$userDetails.profilePicture',
                    lastMessage: { $ifNull: ['$lastMessage', 'No messages yet.'] },
                    lastMessageTimestamp: 1,
                    unreadCount: 1,
                }
            },
            // 10. Sort conversations to show the one with the most recent message first
            { $sort: { lastMessageTimestamp: -1 } }
        ];

        const conversations = await Message.aggregate(pipeline);

        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('Error fetching chat users:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching chat users.' });
    }
};

module.exports = {
    getChatUsers
};