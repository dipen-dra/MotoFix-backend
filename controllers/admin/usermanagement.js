// // // CRUD
// // const User = require("../../models/User")
// // const bcrypt = require("bcrypt")

// // exports.authenticateUser = async (req, res, next) => {
// //     try {
// //         // 1. Get token from header
// //         const authHeader = req.headers.authorization;

// //         // 2. Check if the token exists and has the "Bearer" prefix
// //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Authentication required. No token provided.",
// //             });
// //         }

// //         // 3. Extract token from the header
// //         const token = authHeader.split(" ")[1];
        
// //         // 4. Verify the token
// //         const decoded = jwt.verify(token, process.env.SECRET);

// //         // 5. Attach user payload to the request for further use in other routes/middleware
// //         // This is more efficient than a database lookup on every request.
// //         req.user = {
// //             _id: decoded._id,
// //             email: decoded.email,
// //             fullName: decoded.fullName,
// //             role: decoded.role
// //         };

// //         next(); // Continue to the next middleware or route handler
// //     } catch (err) {
// //         // Handle different JWT errors
// //         if (err.name === 'JsonWebTokenError') {
// //              return res.status(401).json({
// //                 success: false,
// //                 message: "Authentication failed: Invalid token.",
// //             });
// //         }
// //         if (err.name === 'TokenExpiredError') {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Authentication failed: Token has expired.",
// //             });
// //         }
// //         return res.status(500).json({
// //             success: false,
// //             message: "Authentication failed due to a server error.",
// //         });
// //     }
// // };

// // /**
// //  * Middleware to check if the authenticated user has an 'admin' role.
// //  * This should be used after the authenticateUser middleware.
// //  */
// // exports.isAdmin = (req, res, next) => {
// //     // Check if user object is attached and if the role is 'admin'
// //     if (req.user && req.user.role === 'admin') {
// //         next(); // User is an admin, proceed
// //     } else {
// //         return res.status(403).json({ // 403 Forbidden
// //             success: false,
// //             message: "Access denied. Admin privileges required.",
// //         });
// //     }
// // };


// const User = require("../../models/User");
// const bcrypt = require("bcrypt");

// const createUser = async (req, res) => {
//     const { fullName, email, password } = req.body;
    
//     // validation
//     if (!fullName || !email || !password) {
//         return res.status(403).json({
//             success: false,
//             message: "Please fill all the fields"
//         });
//     }
    
//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "User already exists" 
//             });
//         }
        
//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);
        
//         // Create new instance of user
//         const newUser = new User({
//             fullName,
//             email,
//             password: hashedPassword
//         });
        
//         // Save the user data
//         await newUser.save();
//         return res.status(201).json({ 
//             success: true, 
//             message: "User registered" 
//         });
        
//     } catch (err) {
//         console.error("Create user error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// const getUsers = async (req, res) => {
//     try {
//         console.log(req.user);
//         const users = await User.find().select("-password"); // exclude passwords
//         return res.status(200).json({
//             success: true,
//             message: "Data fetched",
//             data: users
//         });
//     } catch (err) {
//         console.error("Get users error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// const getOneUser = async (req, res) => {
//     try {
//         const _id = req.params.id;
//         const user = await User.findById(_id).select("-password"); // exclude password
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }
        
//         return res.status(200).json({
//             success: true,
//             message: "One user fetched",
//             data: user
//         });
//     } catch (err) {
//         console.error("Get one user error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// const updateOneUser = async (req, res) => {
//     const { fullName, email } = req.body;
//     const _id = req.params.id;
    
//     // Basic validation
//     if (!fullName && !email) {
//         return res.status(400).json({
//             success: false,
//             message: "At least one field is required to update"
//         });
//     }
    
//     try {
//         // Check if user exists
//         const existingUser = await User.findById(_id);
//         if (!existingUser) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }
        
//         // If email is being updated, check for duplicates
//         if (email && email !== existingUser.email) {
//             const emailExists = await User.findOne({ 
//                 email: email, 
//                 _id: { $ne: _id } 
//             });
//             if (emailExists) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Email already exists"
//                 });
//             }
//         }
        
//         // Build update object
//         const updateFields = {};
//         if (fullName) updateFields.fullName = fullName;
//         if (email) updateFields.email = email;
        
//         await User.updateOne(
//             { _id: _id },
//             { $set: updateFields }
//         );
        
//         return res.status(200).json({
//             success: true,
//             message: "User data updated"
//         });
        
//     } catch (err) {
//         console.error("Update user error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// const deleteOneUser = async (req, res) => {
//     try {
//         const _id = req.params.id;
        
//         const result = await User.deleteOne({ _id: _id });
        
//         if (result.deletedCount === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }
        
//         return res.status(200).json({
//             success: true,
//             message: "User deleted"
//         });
        
//     } catch (err) {
//         console.error("Delete user error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// module.exports = {
//     createUser,
//     getUsers,
//     getOneUser,
//     updateOneUser,
//     deleteOneUser
// };


const User = require("../../models/User");

// This function was provided in a previous step but is included here for completeness.
module.exports.createUser = async (req, res) => {
    // ... implementation for creating a user
};

module.exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.getOneUser = async (req, res) => {
    // ... implementation
};

module.exports.updateOneUser = async (req, res) => {
    // ... implementation
};

module.exports.deleteOneUser = async (req, res) => {
    // ... implementation
};

// Function to promote a user to admin
module.exports.promoteUserToAdmin = async (req, res) => {
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