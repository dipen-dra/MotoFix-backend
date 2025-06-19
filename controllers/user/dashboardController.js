// const Booking = require('../../models/Booking');

// /**
//  * @desc    Get user dashboard summary
//  * @route   GET /api/user/dashboard-summary
//  * @access  Private
//  */
// const getDashboardSummary = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         // Get count of upcoming bookings
//         const upcomingBookings = await Booking.countDocuments({
//             customer: userId,
//             status: { $in: ['Pending', 'In Progress'] }
//         });

//         // Get count of completed services
//         const completedServices = await Booking.countDocuments({
//             customer: userId,
//             status: 'Completed'
//         });

//         // Get 5 most recent bookings
//         const recentBookings = await Booking.find({ customer: userId })
//             .sort({ date: -1 })
//             .limit(5);

//         res.json({
//             success: true,
//             data: {
//                 upcomingBookings,
//                 completedServices,
//                 recentBookings
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// // This export style is crucial for it to be imported correctly.
// module.exports = {
//     getDashboardSummary
// };



const Booking = require('../../models/Booking');

/**
 * @desc    Get user dashboard summary
 * @route   GET /api/user/dashboard-summary
 * @access  Private
 */
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        const upcomingBookings = await Booking.countDocuments({
            customer: userId,
            status: { $in: ['Pending', 'In Progress'] }
        });

        const completedServices = await Booking.countDocuments({
            customer: userId,
            status: 'Completed'
        });

        const recentBookings = await Booking.find({ customer: userId })
            .sort({ date: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                upcomingBookings,
                completedServices,
                recentBookings
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getDashboardSummary
};
// This code defines a controller function to get the user dashboard summary.
// It retrieves counts of upcoming and completed bookings, as well as the most recent bookings,