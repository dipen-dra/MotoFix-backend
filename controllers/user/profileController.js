const User = require('../../models/User');

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
        // Populate workshop for admin roles here if needed by user dashboard for any reason
        const user = await User.findById(req.user.id).select('-password'); 
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error("User getUserProfile Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 * @MODIFIED: Allow updating location coordinates
 */
const updateUserProfile = async (req, res) => {
    // Destructure 'address' and 'coordinates' from req.body
    const { fullName, email, phone, address, coordinates } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address !== undefined ? address : user.address;

        // --- NEW: Update location coordinates if provided ---
        if (coordinates) {
            try {
                const parsedCoordinates = JSON.parse(coordinates); // Should be a JSON string of [longitude, latitude]
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && typeof parsedCoordinates[0] === 'number' && typeof parsedCoordinates[1] === 'number') {
                    user.location = {
                        type: 'Point',
                        coordinates: parsedCoordinates
                    };
                } else {
                    console.warn("Invalid coordinates format received for user profile update:", coordinates);
                    // Optionally, send a client-side error or just ignore invalid input
                }
            } catch (e) {
                console.warn("Failed to parse coordinates for user profile update:", coordinates, e);
            }
        } else if (address !== undefined && !coordinates) {
             // If address is updated but no coordinates, and old coordinates were default [0,0], consider clearing them
             // Or keep old coordinates. Let's keep them if not explicitly provided.
        }

        if (req.file) {
             // If there was an old profile picture, delete it
            if (user.profilePicture) {
                const oldImagePath = path.join(__dirname, '../../', user.profilePicture);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            user.profilePicture = req.file.path.replace(/\\/g, "/"); 
        }
        
        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({ success: true, data: userResponse, message: "Profile updated successfully." });
    } catch (error) {
        console.error("User updateUserProfile Error:", error);
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