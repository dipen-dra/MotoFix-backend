const express = require("express")
const router = express.Router()
const { registerUser, loginUser, getUserById } = require("../controllers/userController")


router.post(
    "/register",
    registerUser
)
router.post(
    "/login",
    loginUser
)

// router.get("/user/:id", getUserById);

module.exports = router
