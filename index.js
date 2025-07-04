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
// 💡 Correctly import the middleware functions by their exported names
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

// 💡 Use the correct middleware function names in the route definition
app.get('/api/admin/chat/users', authenticateUser, isAdmin, getChatUsers);

app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/payment/esewa', esewaRoute);

// --- Real-time Chat Logic ---
io.on('connection', (socket) => {
    // console.log(`✅ User Connected: ${socket.id}`);

    socket.on('join_room', async (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined private room: ${roomName}`);

        try {
            const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
            socket.emit('chat_history', history);
        } catch (error) {
            console.error(`Error fetching chat history for room ${roomName}:`, error);
        }
    });

    socket.on('send_message', async (data) => {
        const message = new Message({
            room: data.room,
            author: data.author,
            authorId: data.authorId,
            message: data.message,
        });
        await message.save();
        socket.to(data.room).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
        // console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
