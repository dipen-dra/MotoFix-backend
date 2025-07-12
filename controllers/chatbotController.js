const Service = require("../models/Service");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Workshop = require("../models/Workshop"); // Import Workshop model

// For guest users - gets all services (UNMODIFIED by workshop, general info)
exports.getServiceInfo = async (req, res) => {
    try {
        const services = await Service.find().select('name description price duration');
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching services.", error: error.message });
    }
};

// For Admin - gets dashboard stats (MODIFIED: filter by workshop for admin)
exports.getAdminDashboardInfo = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }
        
        const workshopMatch = { workshop: workshopId };

        const [revenueResult, totalBookings, pendingBookings, inProgressBookings] = await Promise.all([
             Booking.aggregate([
                { $match: { ...workshopMatch, status: 'Completed', isPaid: true } },
                { $group: { _id: null, total: { $sum: "$finalAmount" } } }
            ]),
             Booking.countDocuments(workshopMatch), // Total bookings for THIS workshop
             Booking.countDocuments({ ...workshopMatch, status: 'Pending' }),
             Booking.countDocuments({ ...workshopMatch, status: 'In Progress' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
                totalBookings,
                pendingBookings,
                inProgressBookings
            }
        });
    } catch (error) {
        console.error("Chatbot AdminDashboardInfo Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching admin data.", error: error.message });
    }
};

// For User - gets their specific dashboard stats (UNMODIFIED by workshop)
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
                upcomingServices: pendingBookings + inProgressBookings,
                completedServices,
                loyaltyPoints: user.loyaltyPoints || 0
            }
        });
    } catch (error) {
        console.error("Chatbot UserDashboardInfo Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching user data.", error: error.message });
    }
};

// Get Profile Info for Chatbot (MODIFIED: Admin profile gets workshop details)
exports.getProfileInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'admin') {
            const adminUser = await User.findById(userId); // Assuming admin user already contains workshop ID (from authenticateUser)
            if (!adminUser) {
                return res.status(404).json({ success: false, message: "Admin user not found." });
            }

            // Fetch the associated workshop details
            const workshop = await Workshop.findById(adminUser.workshop)
                                            .select('workshopName ownerName email phone address');
            
            if (!workshop) {
                // This scenario means an admin is created but no workshop is linked/found.
                // It should ideally be handled during admin creation/profile setup.
                return res.status(404).json({ success: false, message: "Workshop profile not found for this admin." });
            }

            // Return workshop details
            res.status(200).json({ success: true, data: workshop });

        } else { // Normal user
            const user = await User.findById(userId).select('fullName email phone address');
            if (!user) {
                return res.status(404).json({ success: false, message: "User profile not found." });
            }
            res.status(200).json({ success: true, data: user });
        }

    } catch (error) {
           console.error("Chatbot Profile Fetch Error:", error);
           res.status(500).json({ success: false, message: "Server error while fetching profile info.", error: error.message });
    }
};