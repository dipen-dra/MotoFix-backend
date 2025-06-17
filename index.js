// require('dotenv').config();

// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db");
// const userRoutes = require("./routes/userRoute");


// // Initialize express app
// const app = express();

// // Connect to Database
// connectDB();

// // Middleware
// // in backend/index.js
// app.use(cors({ origin: "*" })); // Enable Cross-Origin Resource Sharing
// app.use(express.json()); // To accept JSON data in the request body

// // API Routes
// app.use("/api/auth", userRoutes);


// // A simple welcome route
// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the motofix-backend API!");
// });

// // Start the server
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });



require('dotenv').config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute");
const adminUserRoutes = require("./routes/admin/adminUserRoute");
const adminServiceRoutes = require("./routes/admin/serviceRoute");
const adminBookingRoutes = require("./routes/admin/bookingRoute");
const adminDashboardRoutes = require("./routes/admin/dashboardRoute");
const adminProfileRoutes = require("./routes/admin/profileRoute");


// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: "*" })); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the request body
app.use('/uploads', express.static('uploads'));

// API Routes
app.use("/api/auth", userRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/profile", adminProfileRoutes);


// A simple welcome route
app.get("/", (req, res) => {
    res.status(200).send("Welcome to the motofix-backend API!");
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
