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
    "/logout",
    (req, res) => {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    }
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
