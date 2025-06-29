const express = require("express");
const router = express.Router();
const {
    getServiceInfo,
    getAdminDashboardInfo,
    getUserDashboardInfo,
    getProfileInfo // Import the new controller
} = require("../controllers/chatbotController");
const { authenticateUser, isAdmin } = require("../middlewares/authorizedUser");

// Public route for anyone to get service info
router.get("/services", getServiceInfo);

// Protected route for admins to get dashboard info
router.get("/admin-dashboard", authenticateUser, isAdmin, getAdminDashboardInfo);

// Protected route for regular users to get dashboard info
router.get("/user-dashboard", authenticateUser, (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden." });
    }
    next();
}, getUserDashboardInfo);

// --- NEW: Protected route for any logged-in user to get their profile ---
router.get("/profile", authenticateUser, getProfileInfo);

module.exports = router;
