// routes/admin/adminUserRoute.js
const express = require("express");
const router = express.Router();
const { 
    createUser, 
    getUsers,
    getOneUser, 
    updateOneUser,
    deleteOneUser,
    promoteUserToAdmin
} = require("../../controllers/admin/usermanagement");
const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser");

router.use(authenticateUser, isAdmin); 

router.get("/", getUsers);
router.get("/:id", getOneUser);
router.post("/create", createUser);
router.put("/:id", updateOneUser);
router.delete("/:id", deleteOneUser);

router.put("/:id/promote", promoteUserToAdmin);

module.exports = router;