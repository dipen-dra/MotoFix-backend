const Service = require("../models/Service");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Workshop = require("../models/Workshop");

exports.getServiceInfo = async (req, res) => {
    try {
        const services = await Service.find().select('name description price duration');
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while fetching services.", error: error.message });
    }
};

exports.getAdminDashboardInfo = async (req, res) => {
    try {
        const [revenueResult, totalBookings, pendingBookings, inProgressBookings] = await Promise.all([
            Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: "$totalCost" } } }
            ]),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Pending' }),
            Booking.countDocuments({ status: 'In Progress' }),
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
        res.status(500).json({ success: false, message: "Server error while fetching admin data.", error: error.message });
    }
};

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
        res.status(500).json({ success: false, message: "Server error while fetching user data.", error: error.message });
    }
};

exports.getProfileInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'admin') {
            const adminUser = await User.findById(userId);
            if (!adminUser) {
                return res.status(404).json({ success: false, message: "Admin user not found." });
            }

            let workshop = await Workshop.findOne({ 
                $or: [{ user: userId }, { email: adminUser.email }] 
            }).select('workshopName ownerName email phone address');
            
            if (!workshop) {
                workshop = new Workshop({
                    user: userId,
                    workshopName: "My Workshop", 
                    ownerName: adminUser.fullName,
                    email: adminUser.email,
                    phone: adminUser.phone || '',
                    address: adminUser.address || ''
                });
                await workshop.save();
            } 
            else if (!workshop.user || workshop.user.toString() !== userId.toString()) {
                workshop.user = userId;
                await workshop.save();
            }

            res.status(200).json({ success: true, data: workshop });

        } else { 
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