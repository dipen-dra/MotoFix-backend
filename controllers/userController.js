const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.registerUser = async (req, res) => {
    const { fullName, email, password } = req.body;
    console.log("Incoming registration data:", req.body); // 👈 LOG THIS

    if (!fullName || !email || !password) {
        return res.status(403).json({
            success: false,
            message: "Please fill all the fields"
        })
    }

    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })

        await newUser.save()
        return res.status(201).json({ success: true, message: "User registered" })

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ success: false, message: "Server error" })
    }
}


exports.loginUser = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing field" })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }

        const payload = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: user,
            token
        })

    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" })
    }
}


exports.getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId).select("-password"); // exclude password
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
