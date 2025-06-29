const express = require("express");
const router = express.Router();
const {
    getServiceInfo,
    getAdminDashboardInfo,
    getUserDashboardInfo
} = require("../controllers/chatbotController");
const { authenticateUser, isAdmin } = require("../middlewares/authorizedUser");

// Public route for anyone to get service info
router.get("/services", getServiceInfo);

// Protected route for admins
router.get("/admin-dashboard", authenticateUser, isAdmin, getAdminDashboardInfo);

// Protected route for regular users
router.get("/user-dashboard", authenticateUser, (req, res, next) => {
    // Ensure the user is not an admin to access this route
    if (req.user.role === 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admins cannot access user dashboard info." });
    }
    next();
}, getUserDashboardInfo);

module.exports = router;
