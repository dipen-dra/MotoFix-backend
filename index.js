// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const connectDB = require('./config/db');
// const esewaRoute = require('./routes/esewaRoute');

// // --- Import the new chatbot routes ---
// const chatbotRoutes = require('./routes/chatbotRoute');

// // Initialize Express app
// const app = express();

// // Connect to the database
// connectDB();

// // Middlewares
// app.use(cors()); // Use cors to allow cross-origin requests
// app.use(express.json()); // To parse JSON bodies
// app.use(express.urlencoded({ extended: false })); // To parse URL-encoded bodies

// // Serve static files from the 'uploads' directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // --- API Routes ---

// // Authentication Routes (for both user and admin login/registration)
// app.use('/api/auth', require('./routes/userRoute')); // This handles /api/register, /api/login

// // Admin Routes
// app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
// app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
// app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
// app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
// app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));

// // --- User Routes ---
// app.use('/api/user', require('./routes/user/dashboardRoute'));
// app.use('/api/user', require('./routes/user/bookingRoute'));
// app.use('/api/user', require('./routes/user/serviceRoute'));
// app.use('/api/user', require('./routes/user/profileRoute'));
// app.use('/api/payment/esewa', esewaRoute);

// // --- NEW: Chatbot Routes ---
// app.use('/api/chatbot', chatbotRoutes);

// // Define the port
// const PORT = process.env.PORT || 5050;

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });





// motofix-backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const esewaRoute = require('./routes/esewaRoute');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

connectDB();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Adjust to your frontend's URL
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/payment/esewa', esewaRoute);

// Real-time Chat Logic
io.on('connection', (socket) => {
    console.log(`✅ User Connected: ${socket.id}`);

    socket.on('join_room', async (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined room: ${roomName}`);

        // 💡 FETCH AND EMIT CHAT HISTORY
        try {
            const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(50);
            socket.emit('chat_history', history);
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    });

    socket.on('send_message', async (data) => {
        const message = new Message({
            room: data.room,
            author: data.author,
            message: data.message,
        });
        await message.save();
        socket.to(data.room).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
