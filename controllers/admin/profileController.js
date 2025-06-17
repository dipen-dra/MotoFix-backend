const Workshop = require('../../models/Workshop');
const { single } = require('../../middlewares/fileupload');

// Get workshop profile
exports.getProfile = async (req, res) => {
    try {
        // Assuming single workshop profile, find one
        const profile = await Workshop.findOne();
        if (!profile) {
            // Create a default one if it doesn't exist
            const defaultProfile = new Workshop({
                ownerName: 'Admin User',
                workshopName: 'MotoFix Central',
                email: 'admin@motofix.com',
                phone: '9988776655',
                address: '123, Main Street, Auto Nagar, Delhi, India'
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