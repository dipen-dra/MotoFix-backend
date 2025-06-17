const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../../controllers/admin/dashboardController");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

router.get("/", authenticateUser, isAdmin, getAnalytics);

module.exports = router;