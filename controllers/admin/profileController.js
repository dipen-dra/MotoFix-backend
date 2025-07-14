// controllers/admin/profileController.js (Updated with pickup/dropoff fields)
const Workshop = require('../../models/Workshop');
const { single } = require('../../middlewares/fileupload');

// Get workshop profile
exports.getProfile = async (req, res) => {
    try {
        const profile = await Workshop.findOne();
        if (!profile) {
            const defaultProfile = new Workshop({
                ownerName: 'Admin User',
                workshopName: 'MotoFix Central',
                email: 'admin@motofix.com',
                phone: '9988776655',
                address: '123, Main Street, Auto Nagar, Delhi, India',
                offerPickupDropoff: false, // Default to false
                pickupDropoffChargePerKm: 0 // Default to 0
            });
            await defaultProfile.save();
            return res.status(200).json({ success: true, data: defaultProfile });
        }
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Update workshop profile
exports.updateProfile = async (req, res) => {
    try {
        let profile = await Workshop.findOne();
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }
        
        const updateData = { ...req.body };

        // Handle new fields for pickup/dropoff
        if (updateData.offerPickupDropoff !== undefined) {
            updateData.offerPickupDropoff = updateData.offerPickupDropoff === 'true'; // Convert string to boolean if from form
        }
        if (updateData.pickupDropoffChargePerKm !== undefined) {
            updateData.pickupDropoffChargePerKm = parseFloat(updateData.pickupDropoffChargePerKm);
        }

        if (req.file) {
            updateData.profilePicture = req.file.path;
        }

        profile = await Workshop.findByIdAndUpdate(profile._id, updateData, { new: true });

        res.status(200).json({ success: true, message: "Profile updated.", data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Middleware for single file upload
exports.uploadProfilePicture = single('profilePicture');