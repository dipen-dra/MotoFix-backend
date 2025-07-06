const express = require("express");
const router = express.Router();
const { 
    createService, 
    getServices, // Changed from getAllServices to getServices
    updateService, 
    deleteService 
} = require("../../controllers/admin/serviceController");

// ⭐️ I'm assuming your middleware file is named authorizedAdmin.js
// If it is authorizedUser.js, this is correct.
const upload = require('../../middlewares/upload'); // ⭐️ 1. Import the upload middleware
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

// ⭐️ 2. Your isAdmin middleware is likely redundant if authenticateAdmin already checks the role.
// I will keep it for now as per your code, but you might simplify this later.

// Add the 'upload' middleware to the POST and PUT routes.
router.post("/", authenticateUser, isAdmin, upload, createService);
router.get("/", authenticateUser, isAdmin, getServices);
router.put("/:id", authenticateUser, isAdmin, upload, updateService);
router.delete("/:id", authenticateUser, isAdmin, deleteService);

module.exports = router;