// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');
const Message = require('./models/Message');
const { authenticateUser, isAdmin } = require('./middlewares/authorizedUser');

const app = express();
const server = http.createServer(app);

connectDB();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"] // Allow all methods
    }
});

// --- Make io instance accessible to our routes ---
app.set('socketio', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make the 'uploads' directory publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));

// --- UPDATED CHAT ROUTES ---
const adminChatRoutes = require('./routes/admin/chatRoute');
const userChatRoutes = require('./routes/user/chatRoute'); // 💡 NEW

app.use('/api/admin/chat', adminChatRoutes);
app.use('/api/user/chat', userChatRoutes); // 💡 NEW - Using the dedicated user chat routes

app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/payment/esewa', esewaRoute);

// --- Real-time Chat Logic ---
io.on('connection', (socket) => {
    // console.log(`✅ User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { roomName, userId } = data;
        socket.join(roomName);

        try {
            await Message.updateMany(
                { room: roomName, authorId: { $ne: userId }, isRead: false },
                { $set: { isRead: true } }
            );

            const eventName = userId === 'admin_user' ? 'messages_read_by_admin' : 'messages_read_by_user';
            socket.emit(eventName, { room: roomName });
            
            const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
            socket.emit('chat_history', history);

        } catch (error) {
            console.error(`Error in join_room for room ${roomName}:`, error);
        }
    });

    socket.on('send_message', async (data) => {
        // This handler is now ONLY for text messages. File messages are handled via the API.
        if (!data.message || data.message.trim() === '') return;

        try {
            const message = new Message({
                room: data.room,
                author: data.author,
                authorId: data.authorId,
                message: data.message,
                isRead: false
            });
            await message.save();
            
            // Emit to everyone in the room, including the sender to confirm it was sent
            io.to(data.room).emit('receive_message', message);

            io.to(data.room).emit('new_message_notification', {
                room: data.room,
                authorId: data.authorId,
                message: data.message
            });
        } catch (error) {
            console.error('Error saving text message:', error);
        }
    });

    socket.on('disconnect', () => {
        // console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});