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
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  // 💡 --- NEW FIELD ---
  // Tracks if the message has been read by the recipient.
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