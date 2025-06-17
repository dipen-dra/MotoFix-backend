// const jwt = require("jsonwebtoken")
// const User = require("../models/User")

// exports.authenticateUser = async (req, res, next) => {
//     try{
//         // Get token from header
//         const authHeader = req.headers.authorization
//         if(!authHeader || !authHeader.startsWith("Bearer")){
//             return res.status(401).json(
//                 {"success": false, "message": "Authentication required"}
//             )
//         }
//         const token = authHeader.split(" ")[1] // get token after Bearar prefix
//         const decoded = jwt.verify(token, process.env.SECRET) 
//         const user = await User.findOne({"_id": decoded._id})
//         if(!user){
//             return res.status(401).json(
//                 {"success": false, "message": "Token mismatch"}
//             )
//         }
//         // attact user to request for further use
//         req.user = user
//         next() // continue to next function
//     }catch(err){
//         return res.status(500).json(
//             {"success": false, "message": "Authentication failed"}
//         )
//     }
// }

// exports.isAdmin = async (req, res, next) => {
//     if(req.user && req.user.role === 'admin'){
//         next()
//     }else{
//         return res.status(403).json(
//             {"success": false, "message": "Admin privilage required"}
//         )
//     }
// }



const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: No token provided."
        });
    }

    try {
        const token = authHeader.split(" ")[1];
        
        // Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.SECRET);
        
        // Find the user from the token's payload, excluding the password
        const user = await User.findById(decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: User associated with this token no longer exists."
            });
        }

        // Attach the user object to the request for the next middleware/controller
        req.user = user;
        next();

    } catch (err) {
        // Log the specific error on the server for debugging purposes
        console.error("Authentication Error:", err.message);

        // Send a clear 401 Unauthorized error to the client
        return res.status(401).json({
            success: false,
            message: `Authentication failed: ${err.message}. Please try logging in again.`
        });
    }
};

exports.isAdmin = (req, res, next) => {
    // This middleware runs *after* authenticateUser, so req.user is available
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ // 403 Forbidden is the correct code for insufficient permissions
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};