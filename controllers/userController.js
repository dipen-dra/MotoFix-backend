
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/**
 * Registers a new user with a 'normal' role.
 */
exports.registerUser = async (req, res) => {
    const { email, fullName, password } = req.body;

    if (!email || !fullName || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields",
        });
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: email,
            fullName: fullName,
            password: hashedPassword
        });
        
        await newUser.save();

        const userData = {
            id: newUser._id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
        };

        return res.status(201).json({
            success: true,
            message: `User '${fullName}' registered successfully.`,
            data: userData,
        });

    } catch (e) {
        console.error("Registration Error:", e);
        return res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

/**
 * Logs in a user and returns a JWT token.
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const payload = {
            _id: user._id, // Standard practice to use 'id'
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '100d' });

        const responseData = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        };

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: responseData,
            token: token,
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a password reset link to the user's email.
 */
exports.sendResetLink = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // To prevent email enumeration, we send a success response even if the user is not found.
            // The message on the frontend will inform them to check their email if an account exists.
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a reset link has been sent.",
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.SECRET,
            { expiresIn: "15m" } // The link will be valid for 15 minutes
        );

        // NOTE: You will need to create the reset password page on your frontend.
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

        const mailOptions = {
            from: `'MotoFix' <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset Your MotoFix Password",
            html: `
                <p>Hello ${user.fullName},</p>
                <p>You requested a password reset. Please click the link below to create a new password:</p>
                <a href="${resetUrl}" style="background-color: #1a202c; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error sending email:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to send reset email. Please try again later.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a reset link has been sent.",
            });
        });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
};

exports.resetPassword = async (req, res) => {
    // Get the token from the URL parameters
    const { token } = req.params;
    // Get the new password from the request body
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    try {
        // 1. Verify the token is valid and not expired
        // This will throw an error if the token is invalid or expired
        const decoded = jwt.verify(token, process.env.SECRET);

        // The decoded payload contains the user's ID
        const userId = decoded.id;

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Find the user by their ID and update their password
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully.",
        });

    } catch (err) {
        // Handle different kinds of errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token." });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token has expired. Please request a new reset link." });
        }

        console.error("Reset Password Error:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
