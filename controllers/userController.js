// // // const User = require("../models/User")
// // // const bcrypt = require("bcrypt")
// // // const jwt = require("jsonwebtoken")

// // // exports.registerUser = async (req, res) => {
// // //     // Get the required field from body
// // //     const { email, fullName, password } = req.body
// // //     // Validation
// // //     if (!email || !fullName || !password) {
// // //         return res.status(403).json(
// // //             {
// // //                 "success": false,
// // //                 "message": "Please fill all the fields"
// // //             }
// // //         )
// // //     }

// // //     try {
// // //         // Check if user exists
// // //         const existingUser = await User.findOne({ email: email })
// // //         if (existingUser) {
// // //             return res.status(400).json({ "success": false, "message": "User exists" })
// // //         }
// // //         // Hash the password
// // //         const hashedPassword = await bcrypt.hash(password, 10) // 10 salt/complexity
// // //         // Create new instance of user
// // //         const newUser = new User(
// // //             {
// // //                 email : email,
// // //                 fullName: fullName,
// // //                 password: hashedPassword
// // //             }
// // //         )
// // //         // Save the user data
// // //         await newUser.save()
// // //         return res.status(201).json({ "success": true, "message": "User registered" , data : newUser })
// // //     } catch (e) {
// // //         console.log(e)
// // //         return res.status(500).json(
// // //             {
// // //                 "success": false,
// // //                 "message": "Server error"
// // //             }
// // //         )
// // //     }
// // // }

// // // // exports.loginUser = async (req, res) => {
// // // //     const { email, password } = req.body
// // // //     // validation
// // // //     if (!email || !password) {
// // // //         return res.status(400).json(
// // // //             { "success": false, "message": "Missing Field" }
// // // //         )
// // // //     }
// // // //     try {
// // // //         const getUser = await User.findOne(
// // // //             { "email": email }
// // // //         )
// // // //         if (!getUser) {
// // // //             return res.status(400).json(
// // // //                 { "success": false, "message": "User not found" }
// // // //             )
// // // //         }
// // // //         // check for password
// // // //         const passwordCheck = await bcrypt.compare(password, getUser.password) 
// // // //         if(!passwordCheck){
// // // //             return res.status(400).json(
// // // //                 { "success": false, "message": "Invalid Credentials" }
// // // //             )
// // // //         }
// // // //         // jwt 
// // // //         const payload = {
// // // //             "_id": getUser._id,
// // // //             "email": getUser.email,
// // // //             "fullName": getUser.fullName
// // // //         }
// // // //         const token = jwt.sign(payload, process.env.SECRET, {expiresIn: '7d'})
// // // //         return res.status(200).json(
// // // //             {
// // // //                 "success": true,
// // // //                 "message": "Login successful",
// // // //                 "data": getUser,
// // // //                 "token": token
// // // //             }
// // // //         )
// // // //     } catch (err) {
// // // //         return res.status(500).json(
// // // //             { "success": false, "message": "Server Error" }
// // // //         )
// // // //     }
// // // // }



// // // exports.loginUser = async (req, res) => {
// // //     const { email, password } = req.body;

// // //     // 1. Validation: Check if email and password are provided
// // //     if (!email || !password) {
// // //         return res.status(400).json({
// // //             "success": false,
// // //             "message": "Missing Field"
// // //         });
// // //     }

// // //     try {
// // //         // 2. Find User: Look for the user by their email address
// // //         const getUser = await User.findOne({ "email": email });

// // //         // 3. Handle User Not Found: If no user, return 404
// // //         if (!getUser) {
// // //             // UPDATED: Changed status from 400 to 404 for clarity on the frontend
// // //             return res.status(404).json({
// // //                 "success": false,
// // //                 "message": "User not found"
// // //             });
// // //         }

// // //         // 4. Compare Passwords: Check if the provided password is correct
// // //         const passwordCheck = await bcrypt.compare(password, getUser.password);
// // //         if (!passwordCheck) {
// // //             // Return 400 for invalid password
// // //             return res.status(400).json({
// // //                 "success": false,
// // //                 "message": "Invalid Credentials"
// // //             });
// // //         }

// // //         // 5. Create JWT Payload
// // //         const payload = {
// // //             "_id": getUser._id,
// // //             "email": getUser.email,
// // //             "fullName": getUser.fullName
// // //         };

// // //         // 6. Sign Token
// // //         const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

// // //         // 7. Send Success Response
// // //         return res.status(200).json({
// // //             "success": true,
// // //             "message": "Login successful",
// // //             "data": {
// // //                 // It's good practice to not send the password hash back
// // //                 _id: getUser._id,
// // //                 email: getUser.email,
// // //                 fullName: getUser.fullName
// // //             },
// // //             "token": token
// // //         });

// // //     } catch (err) {
// // //         console.log(err); // Log the error for debugging
// // //         return res.status(500).json({
// // //             "success": false,
// // //             "message": "Server Error"
// // //         });
// // //     }
// // // };




// // const User = require("../models/User");
// // const bcrypt = require("bcrypt");
// // const jwt = require("jsonwebtoken");

// // /*
// // NOTE: Ensure your User model in 'models/User.js' includes a 'role' field.

// // Example Mongoose Schema:
// // const userSchema = new mongoose.Schema({
// //   email: { type: String, required: true, unique: true },
// //   fullName: { type: String, required: true },
// //   password: { type: String, required: true },
// //   role: {
// //     type: String,
// //     enum: ['user', 'admin'],
// //     default: 'user'
// //   }
// // });

// // module.exports = mongoose.model('User', userSchema);
// // */

// // /**
// //  * Registers a new user. If the email matches the admin email,
// //  * the user is assigned the 'admin' role.
// //  */
// // exports.registerUser = async (req, res) => {
// //     // Get the required fields from the body
// //     const { email, fullName, password } = req.body;

// //     // 1. Validation
// //     if (!email || !fullName || !password) {
// //         return res.status(400).json({
// //             success: false,
// //             message: "Please fill all the fields",
// //         });
// //     }

// //     try {
// //         // 2. Check if user already exists
// //         const existingUser = await User.findOne({ email: email });
// //         if (existingUser) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "User with this email already exists",
// //             });
// //         }

// //         // 3. Hash the password
// //         const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

// //         // 4. Create a new user instance
// //         const newUser = new User({
// //             email: email,
// //             fullName: fullName,
// //             password: hashedPassword,
// //         });

// //         // 5. Assign admin role if email and password match admin credentials
// //         if (email === 'dipendrajr999@gmail.com' && password === 'admin123') {
// //             newUser.role = 'admin';
// //         }

// //         // 6. Save the new user to the database
// //         await newUser.save();

// //         // 7. Prepare user data for the response (excluding the password)
// //         const userData = {
// //             _id: newUser._id,
// //             email: newUser.email,
// //             fullName: newUser.fullName,
// //             role: newUser.role,
// //         };

// //         // 8. Send success response
// //         return res.status(201).json({
// //             success: true,
// //             message: "User registered successfully",
// //             data: userData,
// //         });
// //     } catch (e) {
// //         console.error("Registration Error:", e);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Server error during registration",
// //         });
// //     }
// // };

// // /**
// //  * Logs in an existing user and returns a JWT token.
// //  */
// // exports.loginUser = async (req, res) => {
// //     const { email, password } = req.body;

// //     // 1. Validation: Check if email and password are provided
// //     if (!email || !password) {
// //         return res.status(400).json({
// //             success: false,
// //             message: "Email and password are required",
// //         });
// //     }

// //     try {
// //         // 2. Find User: Look for the user by their email address
// //         const user = await User.findOne({ email: email });

// //         // 3. Handle User Not Found
// //         if (!user) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: "User not found",
// //             });
// //         }

// //         // 4. Compare Passwords
// //         const isPasswordCorrect = await bcrypt.compare(password, user.password);
// //         if (!isPasswordCorrect) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: "Invalid credentials",
// //             });
// //         }

// //         // 5. Create JWT Payload, including the user's role
// //         const payload = {
// //             _id: user._id,
// //             email: user.email,
// //             fullName: user.fullName,
// //             role: user.role, // Include role in the token
// //         };

// //         // 6. Sign Token
// //         const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

// //         // 7. Prepare response data (excluding password)
// //         const responseData = {
// //             _id: user._id,
// //             email: user.email,
// //             fullName: user.fullName,
// //             role: user.role,
// //         };

// //         // 8. Send Success Response
// //         return res.status(200).json({
// //             success: true,
// //             message: "Login successful",
// //             data: responseData,
// //             token: token,
// //         });

// //     } catch (err) {
// //         console.error("Login Error:", err);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Server Error",
// //         });
// //     }
// // };





// const User = require("../models/User");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// /**
//  * Registers a new user.
//  * For the first-time setup, if a user registers with a specific email
//  * AND no admin account exists yet, they are assigned the 'admin' role.
//  * This is a safer way to seed an initial admin user.
//  */
// exports.registerUser = async (req, res) => {
//     const { email, fullName, password } = req.body;

//     // 1. Validation
//     if (!email || !fullName || !password) {
//         return res.status(400).json({
//             success: false,
//             message: "Please fill all the fields",
//         });
//     }

//     try {
//         // 2. Check if user already exists
//         const existingUser = await User.findOne({ email: email });
//         if (existingUser) {
//             return res.status(409).json({ // 409 Conflict is more specific
//                 success: false,
//                 message: "User with this email already exists",
//             });
//         }

//         // 3. Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // 4. Create a new user instance
//         const newUser = new User({
//             email: email,
//             fullName: fullName,
//             password: hashedPassword,
//             // Role defaults to 'normal' based on your schema
//         });

//         // 5. Securely assign the first admin role
//         // This should only happen once. For production, use a more robust seeding script.
//         if (email === 'dipendrajr999@gmail.com') {
//             const adminCount = await User.countDocuments({ role: 'admin' });
//             if (adminCount === 0) {
//                 newUser.role = 'admin';
//             }
//         }

//         // 6. Save the new user to the database
//         await newUser.save();

//         // 7. Prepare user data for the response (excluding the password)
//         const userData = {
//             _id: newUser._id,
//             email: newUser.email,
//             fullName: newUser.fullName,
//             role: newUser.role,
//         };

//         // 8. Send success response
//         return res.status(201).json({
//             success: true,
//             message: `User '${fullName}' registered successfully as a ${newUser.role}.`,
//             data: userData,
//         });

//     } catch (e) {
//         console.error("Registration Error:", e);
//         return res.status(500).json({
//             success: false,
//             message: "Server error during registration",
//         });
//     }
// };

// /**
//  * Logs in an existing user and returns a JWT token containing their role.
//  */
// exports.loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     // 1. Validation
//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: "Email and password are required",
//         });
//     }

//     try {
//         // 2. Find User
//         const user = await User.findOne({ email: email });

//         // 3. Handle User Not Found
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }

//         // 4. Compare Passwords
//         const isPasswordCorrect = await bcrypt.compare(password, user.password);
//         if (!isPasswordCorrect) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid credentials",
//             });
//         }

//         // 5. Create JWT Payload
//         const payload = {
//             _id: user._id,
//             email: user.email,
//             fullName: user.fullName,
//             role: user.role, // Include role in the token
//         };

//         // 6. Sign Token
//         const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

//         // 7. Prepare response data
//         const responseData = {
//             _id: user._id,
//             email: user.email,
//             fullName: user.fullName,
//             role: user.role,
//         };

//         // 8. Send Success Response
//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: responseData,
//             token: token,
//         });

//     } catch (err) {
//         console.error("Login Error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server Error",
//         });
//     }
// };



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