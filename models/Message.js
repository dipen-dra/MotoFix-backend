// models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    required: true 
  },
  authorId: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String,
    // A text message is only required if a file is NOT being sent.
    required: function() {
        return !this.fileUrl;
    }
  },
  // --- NEW FIELDS for file uploads ---
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  // --- END NEW FIELDS ---
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

// Add indexes to optimize query performance for chat history and unread counts
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ room: 1, isRead: 1, authorId: 1 });


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;