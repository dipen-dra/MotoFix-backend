// // require('dotenv').config();

// // const express = require("express");
// // const cors = require("cors");
// // const connectDB = require("./config/db");
// // const userRoutes = require("./routes/userRoute");


// // // Initialize express app
// // const app = express();

// // // Connect to Database
// // connectDB();

// // // Middleware
// // // in backend/index.js
// // app.use(cors({ origin: "*" })); // Enable Cross-Origin Resource Sharing
// // app.use(express.json()); // To accept JSON data in the request body

// // // API Routes
// // app.use("/api/auth", userRoutes);


// // // A simple welcome route
// // app.get("/", (req, res) => {
// //     res.status(200).send("Welcome to the motofix-backend API!");
// // });

// // // Start the server
// // const PORT = process.env.PORT || 8000;
// // app.listen(PORT, () => {
// //     console.log(`Server is running on http://localhost:${PORT}`);
// // });



// require('dotenv').config();

// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db");
// const userRoutes = require("./routes/userRoute");
// const adminUserRoutes = require("./routes/admin/adminUserRoute");
// const adminServiceRoutes = require("./routes/admin/serviceRoute");
// const adminBookingRoutes = require("./routes/admin/bookingRoute");
// const adminDashboardRoutes = require("./routes/admin/dashboardRoute");
// const adminProfileRoutes = require("./routes/admin/profileRoute");


// // Initialize express app
// const app = express();

// // Connect to Database
// connectDB();

// // Middleware
// app.use(cors({ origin: "*" })); // Enable Cross-Origin Resource Sharing
// app.use(express.json()); // To accept JSON data in the request body
// app.use('/uploads', express.static('uploads'));

// // API Routes
// app.use("/api/auth", userRoutes);
// app.use("/api/admin/users", adminUserRoutes);
// app.use("/api/admin/services", adminServiceRoutes);
// app.use("/api/admin/bookings", adminBookingRoutes);
// app.use("/api/admin/dashboard", adminDashboardRoutes);
// app.use("/api/admin/profile", adminProfileRoutes);


// // A simple welcome route
// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the motofix-backend API!");
// });

// // Start the server
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });




// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');


// Initialize Express app
const app = express();

// Connect to the database
connectDB();

// Middlewares
app.use(cors()); // Use cors to allow cross-origin requests
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: false })); // To parse URL-encoded bodies

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---

// Authentication Routes (for both user and admin login/registration)
app.use('/api', require('./routes/userRoute')); // This handles /api/register, /api/login

// Admin Routes
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));

// --- NEW: User Dashboard Routes ---
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));

// Define the port
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});