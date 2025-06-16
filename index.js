require('dotenv').config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute");


// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middleware
// in backend/index.js
app.use(cors({ origin: "*" })); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the request body

// API Routes
app.use("/api/auth", userRoutes);


// A simple welcome route
app.get("/", (req, res) => {
    res.status(200).send("Welcome to the motofix-backend API!");
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

