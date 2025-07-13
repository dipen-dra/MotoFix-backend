// routes/admin/profileRoute.js

const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("../../controllers/admin/profileController");
const { authenticateUser, isAdmin, isSuperadmin } = require("../../middlewares/authorizedUser");
const fileupload = require("../../middlewares/fileupload"); // <-- IMPORT your multer config directly

// ====================================================================
//  ROUTE FOR A LOGGED-IN ADMIN TO GET/UPDATE THEIR *OWN* PROFILE
//  This is the route your React ProfilePage will use for regular admins.
// ====================================================================

// GET /api/admin/profile
// Fetches the profile of the currently logged-in admin.
router.get(
    "/",
    authenticateUser,
    isAdmin, // Ensures the user is at least an 'admin'
    getProfile
);

// PUT /api/admin/profile
// Updates the profile of the currently logged-in admin.
router.put(
    "/",
    authenticateUser,
    isAdmin,
    fileupload.single('profilePicture'), // <-- CORRECT: Use multer middleware here.
    updateProfile // The controller handles the logic.
);


// ====================================================================
//  ROUTE FOR A SUPERADMIN TO UPDATE *ANY* WORKSHOP PROFILE BY ID
//  This is used by the Superadmin Workshop Management page.
// ====================================================================
// Note: The controller for this is in workshopManagementController.js,
// which is a better place for it. This keeps profile logic separate.
// I've included it here for context, but it's better to move it to `workshopRoute.js`.

// Example of how a superadmin route would look (better placed in workshopRoute.js)
// const workshopController = require('../../controllers/admin/workshopManagementController');
// router.put(
//     '/:id',
//     authenticateUser,
//     isSuperadmin, // <-- Middleware to ensure ONLY superadmin can access
//     fileupload.single('profilePicture'),
//     workshopController.updateWorkshop // Assumes you have a controller for this
// );


module.exports = router;