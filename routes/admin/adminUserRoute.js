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


router.get("/", authenticateUser, isAdmin, getUsers);
router.get("/:id", authenticateUser, isAdmin, getOneUser);
router.post("/create", authenticateUser, isAdmin, createUser);
router.put("/:id", authenticateUser, isAdmin, updateOneUser);
router.delete("/:id", authenticateUser, isAdmin, deleteOneUser);
router.put("/:id/promote", authenticateUser, isAdmin, promoteUserToAdmin);

module.exports = router;