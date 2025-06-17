// const express = require("express")
// const router = express.Router()
// const { createUser, getUsers,
//     getOneUser, updateOneUser,
//     deleteOneUser } = require("../../controllers/admin/usermanagement")
// const { authenticateUser, isAdmin } = require("../../middlewares/authorizedUser")

// router.post(
//     "/create",
//     createUser
// )

// router.get(
//     "/",
//     authenticateUser,
//     isAdmin,
//     getUsers
// )

// router.get(
//     "/:id", // req.params.id
//     getOneUser
// )

// router.put(
//     "/:id", // req.params.id
//     updateOneUser
// )

// router.delete(
//     "/:id", // req.params.id
//     deleteOneUser
// )

// module.exports = router



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

// Note: Ensure that every function listed in the 'require' statement above
// is correctly defined and exported in your usermanagement.js file.

router.get("/", authenticateUser, isAdmin, getUsers);
router.get("/:id", authenticateUser, isAdmin, getOneUser);
router.post("/create", authenticateUser, isAdmin, createUser);
router.put("/:id", authenticateUser, isAdmin, updateOneUser);
router.delete("/:id", authenticateUser, isAdmin, deleteOneUser);
router.put("/:id/promote", authenticateUser, isAdmin, promoteUserToAdmin);

module.exports = router;