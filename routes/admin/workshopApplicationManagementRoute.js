const express = require('express');
const router = express.Router();
const {
    getAllApplications,
    approveApplication,
    rejectApplication
} = require('../../controllers/admin/workshopApplicationManagementController');
const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser');

router.use(authenticateUser, isAdmin);

router.route('/')
    .get(getAllApplications);

router.route('/:id/approve')
    .post(approveApplication); // CHANGED from .put to .post

router.route('/:id/reject')
    .post(rejectApplication);  // CHANGED from .put to .post

module.exports = router;