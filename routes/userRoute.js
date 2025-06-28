const express = require("express")
const router = express.Router()
const { registerUser, loginUser, getUserById, sendResetLink, resetPassword } = require("../controllers/userController")


router.post(
    "/register",
    registerUser
)
router.post(
    "/login",
    loginUser
)

router.post(
    "/forgot-password",
    sendResetLink
)

router.post(
    "/reset-password/:token",
    resetPassword
)


module.exports = router
