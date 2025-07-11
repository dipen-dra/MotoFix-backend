const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: { type: String, required: true, index: true },
    author: { type: String, required: true },
    authorId: { type: String, required: true },
    message: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    isRead: { type: Boolean, default: false },
    
    // ⭐️ REPLACED single flag with two new flags
    clearedForUser: { type: Boolean, default: false },
    clearedForAdmin: { type: Boolean, default: false }

}, {
    timestamps: true
});

// Create a compound index for efficient querying
messageSchema.index({ room: 1, clearedForUser: 1 });
messageSchema.index({ room: 1, clearedForAdmin: 1 });

module.exports = mongoose.model('Message', messageSchema);