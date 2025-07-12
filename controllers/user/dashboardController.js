// Import both necessary models
const Booking = require('../../models/Booking');
const User = require('../../models/User');

/**
 * @desc    Get user dashboard summary
 * @route   GET /api/user/dashboard-summary
 * @access  Private
 * @description This controller retrieves counts of upcoming and completed bookings,
 * the most recent bookings, and the user's current loyalty points.
 */
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use Promise.all to fetch user data and booking stats in parallel for better performance
        const [user, upcomingBookings, completedServices, recentBookings] = await Promise.all([
            User.findById(userId).select('loyaltyPoints'), // Fetch the user to get loyalty points
            Booking.countDocuments({
                customer: userId,
                status: { $in: ['Pending', 'In Progress'] }
            }),
            Booking.countDocuments({
                customer: userId,
                status: 'Completed'
            }),
            // Populate workshop for recent bookings to display workshop name in frontend
            Booking.find({ customer: userId })
                .populate('workshop', 'workshopName') // Populate workshop name
                .sort({ date: -1 }) 
                .limit(5)
        ]);
        
        // Handle case where user might not be found
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                upcomingBookings,
                completedServices,
                recentBookings,
                loyaltyPoints: user.loyaltyPoints || 0 // Add loyalty points to the response
            }
        });
    } catch (error) {
        console.error("User getDashboardSummary Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getDashboardSummary
};