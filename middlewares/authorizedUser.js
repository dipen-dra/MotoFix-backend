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
        
        const decoded = jwt.verify(token, process.env.SECRET);
        
        const user = await User.findById(decoded._id).select("-password");

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
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges are required."
        });
    }
};