const Booking = require("../../models/Booking");
const User = require("../../models/User");

exports.getAnalytics = async (req, res) => {
    try {
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);

        const totalBookings = await Booking.countDocuments();
        const newUsers = await User.countDocuments({
            createdAt: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        });

        // For charts
        const revenueData = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: {
                _id: { $month: "$date" },
                revenue: { $sum: "$totalCost" }
            }},
            { $sort: { _id: 1 } }
        ]);

        const servicesData = await Booking.aggregate([
            { $group: {
                _id: "$serviceType",
                bookings: { $sum: 1 }
            }}
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                totalBookings,
                newUsers,
                revenueData,
                servicesData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};