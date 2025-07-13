// routes/admin/serviceRoute.js
const express = require("express");
const router = express.Router();
const { 
    createService, 
    getServices,
    updateService, 
    deleteService,
    getServiceWithReviews 
} = require("../../controllers/admin/serviceController");

const upload = require('../../middlewares/upload');
// Import all necessary middlewares
const { authenticateUser, isAdmin, isWorkshopAdmin } = require("../../middlewares/authorizedUser"); 

// --- CHANGE THIS LINE ---
// Replace `isAdmin` with `isWorkshopAdmin` to ensure `req.workshopId` is populated
router.use(authenticateUser, isWorkshopAdmin); 

router.post("/", upload, createService);
router.get("/", getServices);
router.put("/:id", upload, updateService);
router.delete("/:id", deleteService);

router.get("/:id/reviews", getServiceWithReviews);

module.exports = router;