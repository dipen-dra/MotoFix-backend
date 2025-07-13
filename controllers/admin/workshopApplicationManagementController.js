// controllers/admin/workshopApplicationManagementController.js
const WorkshopApplication = require('../../models/WorkshopApplication');
const Workshop = require('../../models/Workshop');
const User = require('../../models/User');
const { geocodeAddress } = require('../../utils/geocoding');
const fs = require('fs'); // For file system operations
const path = require('path'); // For path resolution

exports.getAllApplications = async (req, res) => {
    try {
        const applications = await WorkshopApplication.find({}).populate('user', 'fullName email');
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error("Admin getAllApplications Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.approveApplication = async (req, res) => {
    const { superadminNotes } = req.body;
    try {
        const application = await WorkshopApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }
        if (application.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Application is already ${application.status}.` });
        }

        const user = await User.findById(application.user);
        if (!user) {
            return res.status(404).json({ success: false, message: "Applicant user not found. Cannot approve." });
        }
        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(400).json({ success: false, message: "Applicant is already an admin or superadmin." });
        }
        if (user.workshop) {
            return res.status(400).json({ success: false, message: "Applicant already linked to a workshop. Please unlink first if re-assigning." });
        }

        let coordinates = null;
        if (application.address) {
            const geoResult = await geocodeAddress(application.address);
            if (geoResult) {
                coordinates = [geoResult.lon, geoResult.lat];
            } else {
                console.warn(`Could not geocode application address: "${application.address}". Workshop location will default to [0,0].`);
            }
        }

        const newWorkshop = new Workshop({
            ownerName: application.ownerName,
            workshopName: application.workshopName,
            email: application.email,
            phone: application.phone,
            address: application.address,
            location: coordinates ? { type: "Point", coordinates } : { type: "Point", coordinates: [0,0] },
            pickupDropoffAvailable: false,
            pickupDropoffCostPerKm: 0
        });
        await newWorkshop.save();

        user.role = 'admin';
        user.workshop = newWorkshop._id;
        await user.save();

        application.status = 'Approved';
        application.superadminNotes = superadminNotes || 'Approved by superadmin.';
        await application.save();

        res.status(200).json({ 
            success: true, 
            message: `Application for ${application.workshopName} approved! User ${user.fullName} is now an admin linked to this workshop.`,
            data: { application, workshop: newWorkshop, user: user.toObject() }
        });

    } catch (error) {
        console.error("Admin approveApplication Error:", error);
        res.status(500).json({ success: false, message: "Server error during application approval.", error: error.message });
    }
};

exports.rejectApplication = async (req, res) => {
    const { superadminNotes } = req.body;
    try {
        const application = await WorkshopApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }
        if (application.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Application is already ${application.status}.` });
        }

        application.status = 'Rejected';
        application.superadminNotes = superadminNotes || 'Application rejected by superadmin.';
        await application.save();

        res.status(200).json({ success: true, message: `Application for ${application.workshopName} rejected.`, data: application });

    } catch (error) {
        console.error("Admin rejectApplication Error:", error);
        res.status(500).json({ success: false, message: "Server error during application rejection.", error: error.message });
    }
};