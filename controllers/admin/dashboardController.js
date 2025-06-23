// const Booking = require("../../models/Booking");
// const User = require("../../models/User");

// exports.getAnalytics = async (req, res) => {
//     try {
//         const totalRevenue = await Booking.aggregate([
//             { $match: { status: 'Completed' } },
//             { $group: { _id: null, total: { $sum: "$totalCost" } } }
//         ]);

//         const totalBookings = await Booking.countDocuments();
        
//         const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//         const newUsers = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

//         const revenueData = await Booking.aggregate([
//             { $match: { status: 'Completed' } },
//             { $group: { _id: { $month: "$date" }, revenue: { $sum: "$totalCost" } } },
//             { $sort: { _id: 1 } }
//         ]);
        
//         const servicesData = await Booking.aggregate([
//              { $group: { _id: '$serviceType', bookings: { $sum: 1 } } }
//         ]);
        
//         // FINAL FIX: Only populate 'customer'. 'serviceType' is a string and cannot be populated.
//         const recentBookings = await Booking.find()
//             .sort({ createdAt: -1 })
//             .limit(5)
//             .populate('customer', 'fullName');

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
//                 totalBookings,
//                 newUsers,
//                 revenueData,
//                 servicesData,
//                 recentBookings
//             }
//         });
//     } catch (error) {
//         console.error("Admin getAnalytics Error:", error);
//         res.status(500).json({ success: false, message: "Server error.", error: error.message });
//     }
// };

const Booking = require("../../models/Booking");
const User = require("../../models/User");

exports.getAnalytics = async (req, res) => {
    try {
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);

        const totalBookings = await Booking.countDocuments({ isPaid: true });
        
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const newUsers = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

        const revenueData = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: { $month: "$date" }, revenue: { $sum: "$totalCost" } } },
            { $sort: { _id: 1 } }
        ]);
        
        const servicesData = await Booking.aggregate([
             { $match: { isPaid: true } }, // Also ensuring this reflects paid bookings
             { $group: { _id: '$serviceType', bookings: { $sum: 1 } } }
        ]);
        
        // --- FIX: Added {isPaid: true} to filter for paid bookings only ---
        const recentBookings = await Booking.find({ isPaid: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'fullName');

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                totalBookings,
                newUsers,
                revenueData,
                servicesData,
                recentBookings
            }
        });
    } catch (error) {
        console.error("Admin getAnalytics Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};