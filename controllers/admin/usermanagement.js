// controllers/admin/usermanagement.js
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const Workshop = require('../../models/Workshop');
const Booking = require('../../models/Booking'); // Import Booking for customer filtering

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        const filterWorkshopId = req.query.workshopId; 

        let query = {};

        if (req.user.role === 'admin') {
            const workshopId = req.workshopId;
            const workshopCustomers = await Booking.distinct('customer', { workshop: workshopId });
            query._id = { $in: workshopCustomers };
        } else if (req.user.role === 'superadmin') {
            if (filterWorkshopId) {
                query.workshop = filterWorkshopId;
            }
        } else {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const totalItems = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .populate('workshop', 'workshopName')
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
        console.error("Admin getUsers Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching users.",
            error: error.message
        });
    }
};

exports.createUser = async (req, res) => {
    const { fullName, email, password, role, phone, workshopId } = req.body; 
    
    let targetRole = role || 'normal';
    let targetWorkshop = null;

    if (req.user.role === 'admin') {
        targetRole = 'normal';
    } else if (req.user.role === 'superadmin') {
        if (targetRole === 'admin' && workshopId) {
            targetWorkshop = await Workshop.findById(workshopId);
            if (!targetWorkshop) {
                return res.status(400).json({ success: false, message: "Provided Workshop ID for admin is invalid." });
            }
        } else if (targetRole === 'admin' && !workshopId) {
            targetWorkshop = new Workshop({
                ownerName: fullName, workshopName: `${fullName}'s Workshop`, email: email, phone: phone || ''
            });
            await targetWorkshop.save();
        }
    } else {
        return res.status(403).json({ success: false, message: "Access denied." });
    }


    if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: "Please provide full name, email, and password." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: targetRole,
            phone: phone || " ",
            workshop: targetWorkshop ? targetWorkshop._id : null
        });
        
        await newUser.save();

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json({ success: true, message: `User '${fullName}' registered successfully.`, data: userWithoutPassword });

    } catch (error) {
        console.error("Admin createUser Error:", error);
        res.status(500).json({ success: false, message: "Server error during user creation.", error: error.message });
    }
};

exports.getOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password").populate('workshop', 'workshopName');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        console.error("Admin getOneUser Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.updateOneUser = async (req, res) => {
    try {
        const { fullName, email, role, phone, workshopId } = req.body;
        let updateData = { fullName, email, role, phone };
        
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        let findQuery = { _id: req.params.id };
        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: "Access denied: Regular admins cannot update user profiles via this route." });
        } else if (req.user.role === 'superadmin') {
            if (role === 'admin' && workshopId) {
                const workshop = await Workshop.findById(workshopId);
                if (!workshop) {
                    return res.status(400).json({ success: false, message: "Provided Workshop ID for admin is invalid." });
                }
                updateData.workshop = workshop._id;
            } else if (role !== 'admin') {
                updateData.workshop = null;
            } else if (role === 'admin' && !workshopId) {
                 let targetWorkshop = await Workshop.findOne({ email: email });
                 if (!targetWorkshop) {
                     targetWorkshop = new Workshop({
                         ownerName: fullName, workshopName: `${fullName}'s Workshop`, email: email, phone: phone || ''
                     });
                     await targetWorkshop.save();
                 }
                 updateData.workshop = targetWorkshop._id;
            }
        } else {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const updatedUser = await User.findByIdAndUpdate(findQuery, updateData, { new: true }).select('-password').populate('workshop', 'workshopName');
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
        let findQuery = { _id: req.params.id };

        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: "Access denied: Regular admins cannot delete users." });
        } else if (req.user.role === 'superadmin') {
            // Superadmin can delete any user.
        } else {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const user = await User.findById(findQuery);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === 'admin' && user.workshop) {
            await Workshop.findByIdAndDelete(user.workshop);
            await Service.deleteMany({ workshop: user.workshop });
            await Booking.updateMany({ workshop: user.workshop }, { $set: { workshop: null, status: 'Cancelled', notes: 'Associated workshop deleted' } });
            await User.updateMany({ workshop: user.workshop, _id: { $ne: user._id } }, { $set: { workshop: null, role: 'normal' } });
        }

        await user.deleteOne();
        res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        console.error("Admin deleteOneUser Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.promoteUserToAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: "Access denied: Only superadmins can promote users." });
        }

        const userId = req.params.id;
        const { workshopId } = req.body; 

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
            workshop = await Workshop.findOne({ email: user.email });
            if (!workshop) {
                const defaultWorkshop = new Workshop({
                    ownerName: user.fullName, workshopName: `${user.fullName}'s Workshop`, email: user.email, phone: user.phone || ''
                });
                await defaultWorkshop.save();
            }
        }

        user.role = 'admin';
        user.workshop = workshop._id;
        await user.save();

        const { password, ...userData } = user.toObject();
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