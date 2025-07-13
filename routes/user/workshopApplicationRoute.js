// routes/user/workshopApplicationRoute.js
const express = require('express');
const router = express.Router();
const {
    applyForWorkshop,
    getMyWorkshopApplication
} = require('../../controllers/user/workshopApplicationController');
const { authenticateUser } = require('../../middlewares/authorizedUser');
const fileupload = require('../../middlewares/fileupload');

router.post('/apply-for-workshop', authenticateUser, fileupload.single('companyDocumentImage'), applyForWorkshop);
router.get('/my-workshop-application', authenticateUser, getMyWorkshopApplication);

module.exports = router;