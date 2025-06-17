const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture } = require("../../controllers/admin/profileController");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

router.get("/", authenticateUser, isAdmin, getProfile);
router.put("/", authenticateUser, isAdmin, uploadProfilePicture, updateProfile);

module.exports = router;