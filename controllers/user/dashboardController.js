const Booking = require('../../models/Booking');
const User = require('../../models/User');

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, upcomingBookings, completedServices, recentBookings] = await Promise.all([
            User.findById(userId).select('loyaltyPoints'),
            Booking.countDocuments({ customer: userId, status: { $in: ['Pending', 'In Progress'] } }),
            Booking.countDocuments({ customer: userId, status: 'Completed' }),
            Booking.find({ customer: userId }).sort({ date: -1 }).limit(5)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                upcomingBookings,
                completedServices,
                recentBookings,
                loyaltyPoints: user.loyaltyPoints || 0
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getDashboardSummary };