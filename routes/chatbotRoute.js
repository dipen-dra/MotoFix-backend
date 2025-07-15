const express = require("express");
const router = express.Router();
const {
    getServiceInfo,
    getAdminDashboardInfo,
    getUserDashboardInfo,
    getProfileInfo
} = require("../controllers/chatbotController");
const { authenticateUser, isAdmin } = require("../middlewares/authorizedUser");

router.get("/services", getServiceInfo);

router.get("/admin-dashboard", authenticateUser, isAdmin, getAdminDashboardInfo);

router.get("/user-dashboard", authenticateUser, (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden." });
    }
    next();
}, getUserDashboardInfo);

router.get("/profile", authenticateUser, getProfileInfo);

module.exports = router;