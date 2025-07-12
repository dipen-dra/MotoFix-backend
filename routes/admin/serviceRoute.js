const express = require("express");
const router = express.Router();
const { 
    createService, 
    getServices,
    updateService, 
    deleteService,
    getServiceWithReviews 
} = require("../../controllers/admin/serviceController");

const upload = require('../../middlewares/upload'); // General image upload middleware
const { authenticateUser, isWorkshopAdmin } = require("../../middlewares/authorizedUser"); // Use isWorkshopAdmin

router.post("/", authenticateUser, isWorkshopAdmin, upload, createService);
router.get("/", authenticateUser, isWorkshopAdmin, getServices);
router.put("/:id", authenticateUser, isWorkshopAdmin, upload, updateService);
router.delete("/:id", authenticateUser, isWorkshopAdmin, deleteService);

router.get("/:id/reviews", authenticateUser, isWorkshopAdmin, getServiceWithReviews);

module.exports = router;