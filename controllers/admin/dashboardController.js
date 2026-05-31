
const Booking = require('../../models/Booking.js');
const User = require('../../models/User.js');


exports.getAnalytics = async (req, res) => {
    try {
        // Purge orphan bookings where customer user account no longer exists
        const activeUserIds = await User.find().distinct('_id');
        await Booking.deleteMany({ customer: { $nin: activeUserIds } });

        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'Completed', isPaid: true } },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);

        const totalBookings = await Booking.countDocuments({ archivedByAdmin: { $ne: true } });
        
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const newUsers = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

        const revenueData = await Booking.aggregate([
            { $match: { status: 'Completed', isPaid: true } },
            { $group: { _id: { $month: "$date" }, revenue: { $sum: "$finalAmount" } } },
            { $sort: { '_id': 1 } }
        ]);
        
        const servicesData = await Booking.aggregate([
             { $match: { archivedByAdmin: { $ne: true } } },
             { $group: { _id: '$serviceType', bookings: { $sum: 1 } } }
        ]);
        
        const recentBookings = await Booking.find({ archivedByAdmin: { $ne: true } })
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