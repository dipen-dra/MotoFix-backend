const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture } = require("../../controllers/admin/profileController");
const { authenticateUser, isWorkshopAdmin } = require("../../middlewares/authorizedUser"); // Use isWorkshopAdmin

router.get("/", authenticateUser, isWorkshopAdmin, getProfile);
// Ensure uploadProfilePicture middleware is used here, before updateProfile
router.put("/", authenticateUser, isWorkshopAdmin, uploadProfilePicture, updateProfile);

module.exports = router;