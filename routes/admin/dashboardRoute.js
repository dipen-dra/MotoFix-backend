// routes/admin/dashboardRoute.js
const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../../controllers/admin/dashboardController");
const { authenticateUser, isWorkshopAdmin } = require("../../middlewares/authorizedUser");

router.get("/", authenticateUser, isWorkshopAdmin, getAnalytics);

module.exports = router;