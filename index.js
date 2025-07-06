// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const http = require('http');
// const { Server } = require("socket.io");
// const connectDB = require('./config/db');
// const Message = require('./models/Message');

// // --- (Routes) ---
// const esewaRoute = require('./routes/esewaRoute');
// const geminiRoutes = require('./routes/gemini'); // Your Gemini route
// const adminChatRoutes = require('./routes/admin/chatRoute');
// const userChatRoutes = require('./routes/user/chatRoute');

// const app = express();
// const server = http.createServer(app);

// // Connect to Database
// connectDB();

// // Setup Socket.IO
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173", // Make sure this is your frontend's address
//         methods: ["GET", "POST", "PUT", "DELETE"]
//     }
// });

// // Make io instance accessible to our routes
// app.set('socketio', io);

// // --- (Middleware) ---
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// // Make the 'uploads' directory publicly accessible
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // --- (API Routes) ---
// app.use('/api/auth', require('./routes/userRoute'));
// app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
// app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
// app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
// app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
// app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
// app.use('/api/admin/chat', adminChatRoutes);

// app.use('/api/user', require('./routes/user/dashboardRoute'));
// app.use('/api/user', require('./routes/user/bookingRoute'));
// app.use('/api/user', require('./routes/user/serviceRoute'));
// app.use('/api/user', require('./routes/user/profileRoute'));
// app.use('/api/user/chat', userChatRoutes);

// app.use('/api/payment/esewa', esewaRoute);
// app.use('/api/gemini', geminiRoutes); // Gemini API route

// // --- (Real-time Chat Logic with Socket.IO) ---
// io.on('connection', (socket) => {
//     // console.log(`✅ User Connected: ${socket.id}`);

//     socket.on('join_room', async (data) => {
//         const { roomName, userId } = data;
//         socket.join(roomName);

//         try {
//             await Message.updateMany(
//                 { room: roomName, authorId: { $ne: userId }, isRead: false },
//                 { $set: { isRead: true } }
//             );

//             const eventName = userId === 'admin_user' ? 'messages_read_by_admin' : 'messages_read_by_user';
//             socket.emit(eventName, { room: roomName });
            
//             const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
//             socket.emit('chat_history', history);

//         } catch (error) {
//             console.error(`Error in join_room for room ${roomName}:`, error);
//         }
//     });

//     socket.on('send_message', async (data) => {
//         if (!data.message || data.message.trim() === '') return;

//         try {
//             const message = new Message({
//                 room: data.room,
//                 author: data.author,
//                 authorId: data.authorId,
//                 message: data.message,
//                 isRead: false
//             });
//             await message.save();
            
//             io.to(data.room).emit('receive_message', message);

//             io.to(data.room).emit('new_message_notification', {
//                 room: data.room,
//                 authorId: data.authorId,
//                 message: data.message
//             });
//         } catch (error) {
//             console.error('Error saving text message:', error);
//         }
//     });

//     socket.on('disconnect', () => {
//         // console.log(`❌ User Disconnected: ${socket.id}`);
//     });
// });

// const PORT = process.env.PORT || 5050;
// server.listen(PORT, () => {
//     console.log(`🚀 Server is running on port ${PORT}`);
// });



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

// Connect to MongoDB
connectDB();

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Attach io instance to app for access in routes
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= API ROUTES ==================

// Authentication & User Management
app.use('/api/auth', require('./routes/userRoute'));

// Admin Routes
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.use('/api/admin/chat', require('./routes/admin/chatRoute'));

// User Routes
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute')); // ✅ Updated services route
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/user/chat', require('./routes/user/chatRoute'));

// Payment Integration
app.use('/api/payment/esewa', require('./routes/esewaRoute'));

// Gemini AI route
app.use('/api/gemini', require('./routes/gemini'));

// ================= SOCKET.IO ==================

io.on('connection', (socket) => {
    // console.log(`✅ User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { roomName, userId } = data;
        socket.join(roomName);

        try {
            // Mark messages as read
            await Message.updateMany(
                { room: roomName, authorId: { $ne: userId }, isRead: false },
                { $set: { isRead: true } }
            );

            const eventName = userId === 'admin_user' ? 'messages_read_by_admin' : 'messages_read_by_user';
            socket.emit(eventName, { room: roomName });

            // Send chat history
            const history = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
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

            // Broadcast new message
            io.to(data.room).emit('receive_message', message);

            // Notify about new message
            io.to(data.room).emit('new_message_notification', {
                room: data.room,
                authorId: data.authorId,
                message: data.message
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        // console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

// ================= START SERVER ==================

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
