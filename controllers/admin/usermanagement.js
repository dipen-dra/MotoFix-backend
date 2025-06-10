// CRUD
const User = require("../../models/User")
const bcrypt = require("bcrypt")

// Create
exports.createUser = async (req, res) => {
    const { fullName, email, password } = req.body
    
    // validation
    if (!fullName || !email || !password) {
        return res.status(403).json({
            success: false,
            message: "Please fill all the fields"
        })
    }
    
    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists" 
            })
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Create new instance of user
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })
        
        // Save the user data
        await newUser.save()
        return res.status(201).json({ 
            success: true, 
            message: "User registered" 
        })
        
    } catch (err) {
        console.error("Create user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Read All
exports.getUsers = async (req, res) => {
    try {
        console.log(req.user)
        const users = await User.find().select("-password"); // exclude passwords
        return res.status(200).json({
            success: true,
            message: "Data fetched",
            data: users
        })
    } catch (err) {
        console.error("Get users error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Read one
exports.getOneUser = async (req, res) => {
    try {
        const _id = req.params.id
        const user = await User.findById(_id).select("-password"); // exclude password
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "One user fetched",
            data: user
        })
    } catch (err) {
        console.error("Get one user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Update
exports.updateOneUser = async (req, res) => {
    const { fullName, email } = req.body
    const _id = req.params.id
    
    // Basic validation
    if (!fullName && !email) {
        return res.status(400).json({
            success: false,
            message: "At least one field is required to update"
        })
    }
    
    try {
        // Check if user exists
        const existingUser = await User.findById(_id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // If email is being updated, check for duplicates
        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({ 
                email: email, 
                _id: { $ne: _id } 
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }
        
        // Build update object
        const updateFields = {};
        if (fullName) updateFields.fullName = fullName;
        if (email) updateFields.email = email;
        
        await User.updateOne(
            { _id: _id },
            { $set: updateFields }
        )
        
        return res.status(200).json({
            success: true,
            message: "User data updated"
        })
        
    } catch (err) {
        console.error("Update user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Delete
exports.deleteOneUser = async (req, res) => {
    try {
        const _id = req.params.id
        
        const result = await User.deleteOne({ _id: _id })
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "User deleted"
        })
        
    } catch (err) {
        console.error("Delete user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}