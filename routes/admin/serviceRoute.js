const express = require("express");
const router = express.Router();
const { 
    createService, 
    getServices,
    updateService, 
    deleteService,
    getServiceWithReviews // <-- IMPORT THE NEW FUNCTION
} = require("../../controllers/admin/serviceController");

const upload = require('../../middlewares/upload');
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");


router.post("/", authenticateUser, isAdmin, upload, createService);
router.get("/", authenticateUser, isAdmin, getServices);
router.put("/:id", authenticateUser, isAdmin, upload, updateService);
router.delete("/:id", authenticateUser, isAdmin, deleteService);

// ===============================================
// THIS IS THE NEW ROUTE YOU NEED TO ADD
// ===============================================
router.get("/:id/reviews", authenticateUser, isAdmin, getServiceWithReviews);


module.exports = router;