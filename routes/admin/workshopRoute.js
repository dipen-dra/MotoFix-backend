// routes/admin/workshopRoute.js
const express = require('express');
const router = express.Router();
const {
    getAllWorkshops,
    getWorkshopById,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop
} = require('../../controllers/admin/workshopManagementController');
const { authenticateUser, isAdmin } = require('../../middlewares/authorizedUser'); 

router.use(authenticateUser, isAdmin); 

router.route('/')
    .get(getAllWorkshops)
    .post(createWorkshop);

router.route('/:id')
    .get(getWorkshopById)
    .put(updateWorkshop)
    .delete(deleteWorkshop);

module.exports = router;