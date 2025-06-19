const express = require('express');
const router = express.Router();

const { getUserProfile, updateUserProfile } = require('../../controllers/user/profileController');
const { authenticateUser } = require('../../middlewares/authorizedUser'); // ✅ Fix
const upload = require('../../middlewares/fileupload');

router.route('/profile')
    .get(authenticateUser, getUserProfile)
    .put(authenticateUser, upload.single('profilePicture'), updateUserProfile);

module.exports = router;
