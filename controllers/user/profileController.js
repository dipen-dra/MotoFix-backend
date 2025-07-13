const User = require('../../models/User');
const { geocodeAddress } = require('../../utils/geocoding');
const fs = require('fs');
const path = require('path');

// Helper function to safely delete files
const safeDeleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        } catch (unlinkError) {
            console.error(`Error deleting file ${filePath}:`, unlinkError);
        }
    }
};

// --- Helper function to build the full image URL ---
const buildFullImageUrl = (req, relativePath) => {
    if (!relativePath) return null;
    return `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
};
// --- End helper function ---


const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); 
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // --- START FIX ---
        // Convert to a plain object to add our new property
        const userResponse = user.toObject();
        // Construct the full, usable URL for the profile picture
        userResponse.profilePictureUrl = buildFullImageUrl(req, userResponse.profilePicture);
        // --- END FIX ---

        res.json({ success: true, data: userResponse });
    } catch (error) {
        console.error("User getUserProfile Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateUserProfile = async (req, res) => {
    const { fullName, email, phone, address, coordinates } = req.body;
    const uploadsRootDir = path.join(__dirname, '../../uploads'); 
    const uploadedFilePath = req.file ? req.file.path : null;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            safeDeleteFile(uploadedFilePath);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address !== undefined ? address : user.address;
        
        // ... (your location/geocoding logic remains the same)
        let newCoordinates = null;
        if (coordinates) { 
            try {
                const parsedCoordinates = JSON.parse(coordinates);
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && 
                    typeof parsedCoordinates[0] === 'number' && typeof parsedCoordinates[1] === 'number') {
                    newCoordinates = parsedCoordinates;
                }
            } catch (e) {
                console.warn("Failed to parse coordinates from frontend, attempting geocoding by address.");
            }
        }
        if (!newCoordinates && address && address.trim() !== '') {
            const geoResult = await geocodeAddress(address);
            if (geoResult) { newCoordinates = [geoResult.lon, geoResult.lat]; }
        }
        if (newCoordinates) {
            user.location = { type: 'Point', coordinates: newCoordinates };
        } else if (address === '' && user.location) {
            user.location = { type: 'Point', coordinates: [0, 0] };
        }
        // ... (end of location logic)

        if (req.file) {
            if (user.profilePicture) {
                const oldImagePath = path.join(uploadsRootDir, user.profilePicture);
                safeDeleteFile(oldImagePath);
            }
            user.profilePicture = path.relative(uploadsRootDir, uploadedFilePath).replace(/\\/g, '/'); 
        }
        
        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        
        // --- START FIX ---
        // Also construct the full URL here for the response after updating
        userResponse.profilePictureUrl = buildFullImageUrl(req, userResponse.profilePicture);
        // --- END FIX ---

        res.json({ success: true, data: userResponse, message: "Profile updated successfully." });
    } catch (error) {
        console.error("User updateUserProfile Error:", error);
        safeDeleteFile(uploadedFilePath);
        
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email address is already in use.' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile
};