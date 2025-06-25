const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
            // The 'role' will default to 'normal' as defined in your UserSchema
        });
        
        await newUser.save();

        const userData = {
            _id: newUser._id,
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

// The loginUser function remains the same as the one I provided in the last step.
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
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

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