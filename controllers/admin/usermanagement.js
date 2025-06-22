

// const User = require("../../models/User");

// // This function was provided in a previous step but is included here for completeness.
// module.exports.createUser = async (req, res) => {
//     // ... implementation for creating a user
// };

// module.exports.getUsers = async (req, res) => {
//     try {
//         const users = await User.find().select('-password');
//         res.status(200).json({ success: true, data: users });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// module.exports.getOneUser = async (req, res) => {
//     // ... implementation
// };

// module.exports.updateOneUser = async (req, res) => {
//     // ... implementation
// };

// module.exports.deleteOneUser = async (req, res) => {
//     // ... implementation
// };

// // Function to promote a user to admin
// module.exports.promoteUserToAdmin = async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         user.role = 'admin';
//         await user.save();

//         const { password, ...userData } = user.toObject();

//         return res.status(200).json({ 
//             success: true, 
//             message: `User ${user.fullName} has been promoted to admin.`,
//             data: userData
//         });

//     } catch (error) {
//         console.error("Promote user error:", error);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };



const User = require("../../models/User");
const bcrypt = require("bcrypt");

// Create a new user
exports.createUser = async (req, res) => {
    const { fullName, email, password, role ,phone} = req.body;

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
            role: role || 'normal',
            phone:phone || " "
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

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({
            success: true,
            message: "Users fetched successfully.",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching users.",
            error: error.message
        });
    }
};

// Get a single user by ID
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

// Update a user
exports.updateOneUser = async (req, res) => {
    try {
        const { fullName, email, role,phone } = req.body;
        const updateData = { fullName, email, role ,phone};

        // If password is provided and not empty, hash it
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

// Delete a user
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

// Promote a user to admin
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