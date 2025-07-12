const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Workshop = require("../models/Workshop"); // Import Workshop model

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
        // Populate the workshop if the user is an admin
        const user = await User.findById(decoded._id).select("-password").populate('workshop');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: User associated with this token no longer exists."
            });
        }

        // Attach the user object to the request for the next middleware/controller
        // This includes the populated 'workshop' object for admin users.
        req.user = user;
        next();

    } catch (err) {
        console.error("Authentication Error:", err.message);
        return res.status(401).json({
            success: false,
            message: `Authentication failed: ${err.message}. Please try logging in again.`
        });
    }
};

exports.isAdmin = (req, res, next) => {
    // This middleware runs *after* authenticateUser, so req.user is available
    if (req.user && req.user.role === 'admin') {
        // For admin, ensure they have an associated workshop ID
        // If an admin is not yet linked to a workshop, they cannot perform admin actions related to a workshop.
        if (!req.user.workshop) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin profile not fully set up. Please link to a workshop."
            });
        }
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};

// --- NEW MIDDLEWARE: Ensures the user is an admin and has a workshop assigned ---
// This middleware can be used on all admin routes that operate on workshop-specific data.
exports.isWorkshopAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin' && req.user.workshop) {
        req.workshopId = req.user.workshop._id; // Attach the workshop ID to the request for easy access
        req.workshopDetails = req.user.workshop; // Attach full workshop details if needed (e.g., for invoice)
        next();
    } else if (req.user && req.user.role === 'admin' && !req.user.workshop) {
        return res.status(403).json({
            success: false,
            message: "Access denied: Your admin profile needs to be linked to a workshop. Please set up your workshop profile."
        });
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};