const express = require("express");
const router = express.Router();
const { createService, getServices, updateService, deleteService } = require("../../controllers/admin/serviceController");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

router.post("/", authenticateUser, isAdmin, createService);
router.get("/", authenticateUser, isAdmin, getServices);
router.put("/:id", authenticateUser, isAdmin, updateService);
router.delete("/:id", authenticateUser, isAdmin, deleteService);

module.exports = router;