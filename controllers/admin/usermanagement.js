const User = require("../../models/User");
const bcrypt = require("bcrypt");
const Workshop = require('../../models/Workshop'); // Import Workshop model

// Get all users with pagination and search (UNMODIFIED by workshop for now)
exports.getUsers = async (req, res) => {
    try {
        // This function retrieves all users for the admin. 
        // If you want to filter users by workshop (e.g., only users who made bookings
        // at this admin's workshop), additional filtering based on booking history would be needed.
        // For now, it remains a global view for any logged-in admin.
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

// --- UNCHANGED FUNCTIONS (remain global operations for admin) ---
exports.createUser = async (req, res) => {
    const { fullName, email, password, role, phone, workshopId } = req.body; // Added workshopId for new admin users
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
        
        // If creating an admin, attempt to link them to a workshop
        let workshop = null;
        if (role === 'admin') {
            // Option 1: Link to an existing workshop if ID is provided
            if (workshopId) {
                workshop = await Workshop.findById(workshopId);
                if (!workshop) {
                    return res.status(400).json({ success: false, message: "Provided Workshop ID is invalid." });
                }
            } else {
                // Option 2: Create a new default workshop for this new admin
                // This assumes an admin *must* have a workshop.
                const defaultWorkshop = new Workshop({
                    ownerName: fullName,
                    workshopName: `${fullName}'s Workshop`,
                    email: email,
                    phone: phone || ''
                });
                workshop = await defaultWorkshop.save();
            }
        }

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: role || 'normal', 
            phone: phone || " ",
            workshop: workshop ? workshop._id : null // Link workshop for admin
        });
        
        await newUser.save();

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json({
            success: true,
            message: `User '${fullName}' registered successfully.`,
            data: userWithoutPassword,
        });

    } catch (error) {
        console.error("Admin createUser Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during user creation.",
            error: error.message
        });
    }
};

exports.getOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password").populate('workshop', 'workshopName'); // Populate workshop for admin users
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Admin getOneUser Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.updateOneUser = async (req, res) => {
    try {
        const { fullName, email, role, phone, workshopId } = req.body; // Added workshopId for admin users
        const updateData = { fullName, email, role, phone };
        
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        // Handle workshop assignment/update if role is admin
        if (role === 'admin') {
            if (workshopId) {
                const workshop = await Workshop.findById(workshopId);
                if (!workshop) {
                    return res.status(400).json({ success: false, message: "Provided Workshop ID for admin is invalid." });
                }
                updateData.workshop = workshop._id;
            } else {
                updateData.workshop = null; // Unlink if workshopId is explicitly set to null/empty
            }
        } else {
            updateData.workshop = null; // Ensure non-admin users don't have a workshop link
        }


        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password').populate('workshop', 'workshopName');
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        console.error("Admin updateOneUser Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.deleteOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // If the user is an admin and linked to a workshop, consider what happens to the workshop.
        // For simplicity, we'll just delete the user here. If the workshop should also be deleted
        // or re-assigned, more logic is needed.
        if (user.role === 'admin' && user.workshop) {
            // Option: delete associated workshop, or transfer ownership.
            // For now, let's keep it simple: just remove the admin. The workshop becomes unlinked.
            // You might want to add a manual process to re-assign/delete workshops without an owner.
        }

        await user.deleteOne(); // Use deleteOne() on the found document
        res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        console.error("Admin deleteOneUser Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// --- MODIFIED: Promote user to admin and link to a workshop ---
exports.promoteUserToAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const { workshopId } = req.body; // Expect workshopId in body when promoting

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: "User is already an admin." });
        }

        let workshop = null;
        if (workshopId) {
            workshop = await Workshop.findById(workshopId);
            if (!workshop) {
                return res.status(400).json({ success: false, message: "Provided Workshop ID is invalid." });
            }
        } else {
            // If no workshopId provided, try to find an existing workshop by user's email
            // or create a new one for this new admin.
            workshop = await Workshop.findOne({ email: user.email });
            if (!workshop) {
                const defaultWorkshop = new Workshop({
                    ownerName: user.fullName,
                    workshopName: `${user.fullName}'s Workshop`,
                    email: user.email,
                    phone: user.phone || ''
                });
                workshop = await defaultWorkshop.save();
            }
        }

        user.role = 'admin';
        user.workshop = workshop._id; // Link the workshop
        await user.save();

        const { password, ...userData } = user.toObject();
        // Return populated workshop info in the response
        const updatedUserResponse = await User.findById(user._id).select('-password').populate('workshop', 'workshopName');

        return res.status(200).json({
            success: true,
            message: `User ${user.fullName} has been promoted to admin and linked to ${workshop.workshopName}.`,
            data: updatedUserResponse
        });
    } catch (error) {
        console.error("Promote user error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};