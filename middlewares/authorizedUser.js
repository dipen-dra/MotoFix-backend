// middlewares/authorizedUser.js

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
        
        const decoded = jwt.verify(token, process.env.SECRET);
        
        // Populate the workshop only if the user is an admin or superadmin
        const user = await User.findById(decoded._id)
                                .select("-password")
                                .populate(decoded.role === 'admin' || decoded.role === 'superadmin' ? 'workshop' : ''); 

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: User associated with this token no longer exists."
            });
        }

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
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};

exports.isWorkshopAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next(); 
    } else if (req.user && req.user.role === 'admin') {
        if (!req.user.workshop) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Your admin profile needs to be linked to a workshop. Please set up your workshop profile."
            });
        }
        req.workshopId = req.user.workshop._id; 
        req.workshopDetails = req.user.workshop; 
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};