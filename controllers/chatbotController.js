const Service = require("../models/Service");
const Booking = require("../models/Booking");
const User = require("../models/User");

// For guest users - gets all services
exports.getServiceInfo = async (req, res) => {
    try {
        const services = await Service.find().select('name description price');
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching services.", error: error.message });
    }
};

// For Admin - gets dashboard stats
exports.getAdminDashboardInfo = async (req, res) => {
    try {
        const [revenueResult, pendingBookings, inProgressBookings] = await Promise.all([
             Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: "$totalCost" } } }
            ]),
             Booking.countDocuments({ status: 'Pending' }),
             Booking.countDocuments({ status: 'In Progress' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
                pendingBookings,
                inProgressBookings
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching admin data.", error: error.message });
    }
};

// For User - gets their specific dashboard stats
exports.getUserDashboardInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, totalBookings, pendingBookings, inProgressBookings, completedServices] = await Promise.all([
            User.findById(userId).select('loyaltyPoints'),
            Booking.countDocuments({ customer: userId }),
            Booking.countDocuments({ customer: userId, status: 'Pending' }),
            Booking.countDocuments({ customer: userId, status: 'In Progress' }),
            Booking.countDocuments({ customer: userId, status: 'Completed' })
        ]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.status(200).json({
            success: true,
            data: {
                totalBookings,
                pendingBookings,
                inProgressBookings,
                completedServices,
                loyaltyPoints: user.loyaltyPoints || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching user data.", error: error.message });
    }
};
