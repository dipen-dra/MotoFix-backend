require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');
const Message = require('./models/Message');
const { getChatUsers } = require('./controllers/admin/chatController');
const { authenticateUser, isAdmin } = require('./middlewares/authorizedUser');

const app = express();
const server = http.createServer(app);

connectDB();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.get('/api/admin/chat/users', authenticateUser, isAdmin, getChatUsers);

app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/payment/esewa', esewaRoute);

// --- Real-time Chat Logic ---
io.on('connection', (socket) => {
    // console.log(`✅ User Connected: ${socket.id}`);

    // 💡 --- UPDATED: 'join_room' now handles marking messages as read ---
    socket.on('join_room', async (data) => {
        const { roomName, userId } = data;
        socket.join(roomName);
        // console.log(`User ${userId} with socket ${socket.id} joined room: ${roomName}`);

        try {
            // Mark all messages in this room sent by the OTHER party as read.
            await Message.updateMany(
                { room: roomName, authorId: { $ne: userId }, isRead: false },
                { $set: { isRead: true } }
            );

            // Notify the client that joined that their messages are now considered read,
            // so they can clear their notification badge.
            const eventName = userId === 'admin_user' ? 'messages_read_by_admin' : 'messages_read_by_user';
            socket.emit(eventName, { room: roomName });
            
            // Fetch and send the chat history to the user who just joined.
            const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
            socket.emit('chat_history', history);

        } catch (error) {
            console.error(`Error in join_room for room ${roomName}:`, error);
        }
    });

    // 💡 --- UPDATED: 'send_message' now also triggers a notification event ---
    socket.on('send_message', async (data) => {
        const message = new Message({
            room: data.room,
            author: data.author,
            authorId: data.authorId,
            message: data.message,
            isRead: false // New messages are always unread initially
        });
        await message.save();
        
        // Send the message to the other person in the room
        socket.to(data.room).emit('receive_message', message);

        // 💡 --- NEW ---
        // Send a generic notification to the room so the recipient can update their UI (e.g., show a badge)
        socket.to(data.room).emit('new_message_notification', {
            room: data.room,
            authorId: data.authorId,
            message: data.message
        });
    });

    socket.on('disconnect', () => {
        // console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});