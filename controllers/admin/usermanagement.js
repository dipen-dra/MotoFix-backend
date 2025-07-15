const User = require("../../models/User");
const bcrypt = require("bcrypt");


exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const query = search
            ? {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const totalItems = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.status(200).json({
            success: true,
            data: users,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching users.",
            error: error.message
        });
    }
};


// --- UNCHANGED FUNCTIONS ---
exports.createUser = async (req, res) => {
    const { fullName, email, password, role, phone } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please provide full name, email, and password."
        });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists."
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: role || 'user', // Default role to 'user'
            phone: phone || " "
        });
        await newUser.save();
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json({
            success: true,
            message: "User created successfully.",
            data: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error during user creation.",
            error: error.message
        });
    }
};

exports.getOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.updateOneUser = async (req, res) => {
    try {
        const { fullName, email, role, phone } = req.body;
        const updateData = { fullName, email, role, phone };
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.deleteOneUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.promoteUserToAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.role = 'admin';
        await user.save();
        const { password, ...userData } = user.toObject();
        return res.status(200).json({
            success: true,
            message: `User ${user.fullName} has been promoted to admin.`,
            data: userData
        });
    } catch (error) {
        console.error("Promote user error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};