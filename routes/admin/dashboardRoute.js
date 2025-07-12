const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../../controllers/admin/dashboardController");
const { authenticateUser, isWorkshopAdmin } = require("../../middlewares/authorizedUser"); // Use isWorkshopAdmin

router.get("/", authenticateUser, isWorkshopAdmin, getAnalytics);

module.exports = router;