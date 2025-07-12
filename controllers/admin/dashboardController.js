// controllers/admin/dashboardController.js

const Booking = require('../../models/Booking.js');
const User = require('../../models/User.js');
const Workshop = require('../../models/Workshop.js'); // Import Workshop model

exports.getAnalytics = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        // Base match query to filter by workshop
        const workshopMatch = { workshop: workshopId };

        const totalRevenueResult = await Booking.aggregate([
            { $match: { ...workshopMatch, status: 'Completed', isPaid: true } },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        const totalBookings = await Booking.countDocuments({ ...workshopMatch, isPaid: true });
        
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        // Count new users who made bookings with this workshop this month
        const newUsers = await User.countDocuments({
            _id: { $in: await Booking.distinct('customer', { ...workshopMatch, createdAt: { $gte: startOfMonth } }) }
        });

        const revenueData = await Booking.aggregate([
            { $match: { ...workshopMatch, status: 'Completed', isPaid: true } },
            { $group: { _id: { $month: "$date" }, revenue: { $sum: "$finalAmount" } } },
            { $sort: { '_id': 1 } }
        ]);
        
        const servicesData = await Booking.aggregate([
            { $match: { ...workshopMatch, isPaid: true } },
            { $group: { _id: '$serviceType', bookings: { $sum: 1 } } }
        ]);
        
        const recentBookings = await Booking.find({ ...workshopMatch, isPaid: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'fullName');

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
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