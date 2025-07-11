const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../../models/Message');
const User = require('../../models/User');

// --- Multer Configuration for File Uploads (no change) ---
const uploadDir = 'uploads/chat';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

// @desc    Upload a file to a chat room (no change)
const uploadChatFile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: `File upload error: ${err.message}` });
        if (!req.file) return res.status(400).json({ message: 'No file was uploaded.' });
        
        const { room, author, authorId, message } = req.body;
        if (!room || !author || !authorId) return res.status(400).json({ message: 'Missing required chat information.' });

        const io = req.app.get('socketio');
        try {
            const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;
            const fileMessage = new Message({ room, author, authorId, message, fileUrl, fileName: req.file.originalname, fileType: req.file.mimetype, isRead: false });
            await fileMessage.save();
            
            io.to(room).emit('receive_message', fileMessage.toObject()); // Use .toObject() to ensure virtuals/timestamps are included
            io.to(room).emit('new_message_notification', { room, authorId, message: message || `Sent a ${req.file.mimetype.split('/')[0]}` });
            res.status(201).json({ success: true, message: 'File sent successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error while processing the file.' });
        }
    });
};

// @desc    Get a list of users who have sent messages for the admin panel (UPDATED)
const getChatUsers = async (req, res) => {
    try {
        const pipeline = [
            // Stage 1: Filter to get ONLY user messages that are not cleared by admin.
            { 
                $match: { 
                    clearedForAdmin: { $ne: true },
                    authorId: { $ne: 'admin_user' } 
                } 
            },
            // Stage 2: Sort by the correct 'createdAt' field to find the most recent user message.
            { $sort: { createdAt: -1 } },
            
            // Stage 3: Group by room to get the single latest message for each conversation.
            {
                $group: {
                    _id: '$room',
                    lastMessageDoc: { $first: '$$ROOT' },
                    unreadCount: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0, 
                    room: '$_id',
                    lastMessage: { $ifNull: ["$lastMessageDoc.message", { $concat: ["Sent a ", { $arrayElemAt: [{ $split: ["$lastMessageDoc.fileType", "/"] }, 0] }] }] },
                    lastMessageTimestamp: '$lastMessageDoc.createdAt', // Use the correct field
                    unreadCount: 1,
                    userId: { $arrayElemAt: [{ $split: ['$_id', '-'] }, 1] }
                }
            },
            { $match: { userId: { $regex: /^[0-9a-fA-F]{24}$/ } } },
            { $addFields: { userIdObj: { $toObjectId: '$userId' } } },
            { $lookup: { from: 'users', localField: 'userIdObj', foreignField: '_id', as: 'userDetails' } },
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
                    unreadCount: 1
                }
            },
            // Final sort by the correct timestamp.
            { $sort: { lastMessageTimestamp: -1 } }
        ];
        const conversations = await Message.aggregate(pipeline);
        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error("Error fetching chat users:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching chat users.' });
    }
};

// @desc    Clear chat history from the ADMIN's view (no change)
const clearChatForAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: 'Invalid User ID.' });
        
        const roomName = `chat-${userId}`;
        await Message.updateMany({ room: roomName }, { $set: { clearedForAdmin: true } });
        res.status(200).json({ success: true, message: 'Chat history has been cleared from your view.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while clearing chat history.' });
    }
};

module.exports = {
    getChatUsers,
    uploadChatFile,
    clearChatForAdmin
};