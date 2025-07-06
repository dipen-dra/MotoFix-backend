// controllers/admin/chatController.js

const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 💡 1. Import the 'fs' module
const Message = require('../../models/Message');
const User = require('../../models/User');

// --- Multer Configuration for File Uploads ---

// 💡 2. Define the upload path as a variable
const uploadDir = 'uploads/chat';

// 💡 3. Check if the directory exists, and create it if it doesn't
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // 💡 4. Use the variable here
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
    fileFilter: function (req, file, cb) {
        cb(null, true);
    }
}).single('file');

// @desc    Upload a file to a chat room
// @route   POST /api/admin/chat/upload and /api/user/chat/upload
// @access  Private
const uploadChatFile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file was uploaded.' });
        }
        
        const { room, author, authorId, message } = req.body;
        if (!room || !author || !authorId) {
            return res.status(400).json({ message: 'Missing required chat information.' });
        }

        const io = req.app.get('socketio');

        try {
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;

            const fileMessage = new Message({
                room,
                author,
                authorId,
                message, 
                fileUrl,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                isRead: false
            });

            await fileMessage.save();
            
            io.to(room).emit('receive_message', fileMessage);
            
            io.to(room).emit('new_message_notification', {
                room: room,
                authorId: authorId,
                message: message || `Sent a ${req.file.mimetype.split('/')[0]}`
            });

            res.status(201).json({ success: true, message: 'File sent successfully.' });

        } catch (error) {
            console.error('Error saving file message:', error);
            res.status(500).json({ message: 'Server error while processing the file.' });
        }
    });
};


// @desc    Get a list of users who have sent messages, with the latest message and unread count for each.
// @route   GET /api/admin/chat/users
// @access  Private/Admin
const getChatUsers = async (req, res) => {
    try {
        const pipeline = [
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$room',
                    lastMessageDoc: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isRead', false] },
                                        { $ne: ['$authorId', 'admin_user'] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    room: '$_id',
                    lastMessage: { 
                        $ifNull: [
                            "$lastMessageDoc.message", 
                            { $concat: ["Sent a ", { $arrayElemAt: [ { $split: ["$lastMessageDoc.fileType", "/"] }, 0 ] }] }
                        ] 
                    },
                    lastMessageTimestamp: '$lastMessageDoc.timestamp',
                    unreadCount: 1,
                    userId: {
                       $let: {
                           vars: { parts: { $split: ['$_id', '-'] } },
                           in: { $arrayElemAt: ['$$parts', 1] }
                       }
                    }
                }
            },
            { $match: { userId: { $regex: /^[0-9a-fA-F]{24}$/ } } },
            { $addFields: { userIdObj: { $toObjectId: '$userId' } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userIdObj',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $match: { userDetails: { $ne: [] } } },
            { $unwind: '$userDetails' },
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
    getChatUsers,
    uploadChatFile
};