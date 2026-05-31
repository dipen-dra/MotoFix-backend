const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { escapeRegex } = require('../middlewares/sanitizeRequest');

/**
 * Registers a new user with a 'normal' role.
 */
const validateStrongPassword = (password) => {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character.";
    }
    return null;
};

exports.registerUser = async (req, res) => {
    const { email, fullName, password } = req.body;

    if (!email || !fullName || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields",
        });
    }

    // ── Field-level injection guards ─────────────────────────────────────────
    // Reject emails that don't match a strict RFC-5321-like pattern
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email address format." });
    }

    // Reject fullName that contains shell/injection metacharacters or is suspiciously long
    const NAME_DANGER_REGEX = /[<>'"`;|&${}\\()]/;
    if (NAME_DANGER_REGEX.test(fullName) || fullName.length > 100) {
        return res.status(400).json({ success: false, message: "Full name contains invalid characters." });
    }

    // 1. Name Check: Password cannot contain user's name (excluding generic test strings)
    const nameParts = fullName.toLowerCase().split(' ');
    const isNameInPassword = nameParts.some(part => 
        part.length > 3 && 
        !['test', 'user', 'booking', 'admin', 'rider'].includes(part) && 
        password.toLowerCase().includes(part)
    );
    if (isNameInPassword) {
        return res.status(400).json({ success: false, message: "Password cannot contain your name." });
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
        return res.status(400).json({
            success: false,
            message: passwordError
        });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: trimmedEmail,
            fullName: fullName,
            password: hashedPassword,
            passwordHistory: [hashedPassword],
            lastPasswordChange: Date.now()
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

    // Reject malformed / injection-bearing email before touching the DB
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const payload = {
            _id: user._id,
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

        // Set the secure HttpOnly Cookie containing the token
        res.cookie('token', token, {
            httpOnly: true,  // 🔒 Prevents JS access, neutralizing XSS hijacking
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF defense
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
        });

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

    // Reject malformed email – prevents injection attempts on this sensitive endpoint
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email address format." });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User with this email does not exist.",
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.SECRET,
            { expiresIn: "15m" }
        );

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
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
        return res.status(400).json({
            success: false,
            message: passwordError
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // 1. Name Check: Password cannot contain user's name (excluding generic test strings)
        const nameParts = user.fullName.toLowerCase().split(' ');
        const isNameInPassword = nameParts.some(part => 
            part.length > 3 && 
            !['test', 'user', 'booking', 'admin', 'rider'].includes(part) && 
            password.toLowerCase().includes(part)
        );
        if (isNameInPassword) {
            return res.status(400).json({ success: false, message: "Password cannot contain your name." });
        }

        // 2. History Check: Cannot reuse last 5 passwords
        const historyList = user.passwordHistory || [];
        for (const oldHash of historyList) {
            if (await bcrypt.compare(password, oldHash)) {
                return res.status(400).json({ success: false, message: "You cannot reuse any of your last 5 passwords." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Keep history to last 5 passwords
        let newHistory = [...historyList];
        newHistory.push(hashedPassword);
        if (newHistory.length > 5) {
            newHistory.shift();
        }

        user.password = hashedPassword;
        user.passwordHistory = newHistory;
        user.lastPasswordChange = Date.now();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully.",
        });

    } catch (err) {
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