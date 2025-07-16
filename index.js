require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app); 
connectDB();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set('socketio', io);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.use('/api/admin/chat', require('./routes/admin/chatRoute'));
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/user/chat', require('./routes/user/chatRoute'));
app.use('/api/payment/esewa', require('./routes/esewaRoute'));
app.use('/api/gemini', require('./routes/gemini'));
app.use('/api/reviews', require('./routes/reviewRoute'));

io.on('connection', (socket) => {
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

            let historyQuery = { room: roomName };
            if (userId === 'admin_user') {
                historyQuery.clearedForAdmin = { $ne: true };
            } else {
                historyQuery.clearedForUser = { $ne: true };
            }
            const history = await Message.find(historyQuery).sort({ timestamp: 1 }).limit(100);
            socket.emit('chat_history', history);
        } catch (error) {
            console.error(`Error in join_room for room ${roomName}:`, error);
        }
    });

    socket.on('send_message', async (data) => {
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
            io.to(data.room).emit('receive_message', message);
            io.to(data.room).emit('new_message_notification', {
                room: data.room,
                authorId: data.authorId,
                message: data.message
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {});
});


app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
});

const PORT = process.env.PORT || 5050;
const listenServer = server.listen(PORT, () => { 
    console.log(`🚀 Server is running on port ${PORT}`);
});


module.exports = { app, server: listenServer, io }; 