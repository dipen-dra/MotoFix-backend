// const User = require('../../models/User');

// /**
//  * @desc    Get user profile
//  * @route   GET /api/user/profile
//  * @access  Private
//  */
// const getUserProfile = async (req, res) => {
//     try {
//         // Populate workshop for admin roles here if needed by user dashboard for any reason
//         const user = await User.findById(req.user.id).select('-password'); 
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }
//         res.json({ success: true, data: user });
//     } catch (error) {
//         console.error("User getUserProfile Error:", error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// /**
//  * @desc    Update user profile
//  * @route   PUT /api/user/profile
//  * @access  Private
//  * @MODIFIED: Allow updating location coordinates
//  */
// const updateUserProfile = async (req, res) => {
//     // Destructure 'address' and 'coordinates' from req.body
//     const { fullName, email, phone, address, coordinates } = req.body;

//     try {
//         const user = await User.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         user.fullName = fullName || user.fullName;
//         user.email = email || user.email;
//         user.phone = phone || user.phone;
//         user.address = address !== undefined ? address : user.address;

//         // --- NEW: Update location coordinates if provided ---
//         if (coordinates) {
//             try {
//                 const parsedCoordinates = JSON.parse(coordinates); // Should be a JSON string of [longitude, latitude]
//                 if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && typeof parsedCoordinates[0] === 'number' && typeof parsedCoordinates[1] === 'number') {
//                     user.location = {
//                         type: 'Point',
//                         coordinates: parsedCoordinates
//                     };
//                 } else {
//                     console.warn("Invalid coordinates format received for user profile update:", coordinates);
//                     // Optionally, send a client-side error or just ignore invalid input
//                 }
//             } catch (e) {
//                 console.warn("Failed to parse coordinates for user profile update:", coordinates, e);
//             }
//         } else if (address !== undefined && !coordinates) {
//              // If address is updated but no coordinates, and old coordinates were default [0,0], consider clearing them
//              // Or keep old coordinates. Let's keep them if not explicitly provided.
//         }

//         if (req.file) {
//              // If there was an old profile picture, delete it
//             if (user.profilePicture) {
//                 const oldImagePath = path.join(__dirname, '../../', user.profilePicture);
//                 if (fs.existsSync(oldImagePath)) {
//                     fs.unlinkSync(oldImagePath);
//                 }
//             }
//             user.profilePicture = req.file.path.replace(/\\/g, "/"); 
//         }
        
//         const updatedUser = await user.save();
//         const userResponse = updatedUser.toObject();
//         delete userResponse.password;

//         res.json({ success: true, data: userResponse, message: "Profile updated successfully." });
//     } catch (error) {
//         console.error("User updateUserProfile Error:", error);
//         if (error.code === 11000) {
//             return res.status(400).json({ success: false, message: 'Email address is already in use.' });
//         }
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// module.exports = {
//     getUserProfile,
//     updateUserProfile
// };






const User = require('../../models/User');
const { geocodeAddress } = require('../../utils/geocoding'); // NEW: Import geocoding helper
const fs = require('fs'); // Added for file deletion if profile picture update fails
const path = require('path'); // Added for file path resolution

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
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
 * @MODIFIED: Allow updating location coordinates, with auto-geocoding from address
 */
const updateUserProfile = async (req, res) => {
    const { fullName, email, phone, address, coordinates } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            // Delete uploaded file if user not found
            if (req.file) {
                const filePath = path.join(__dirname, '../../', req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email; // Ensure email update logic is safe (unique index)
        user.phone = phone || user.phone;
        user.address = address !== undefined ? address : user.address;

        // --- NEW/MODIFIED LOGIC for LOCATION ---
        let newCoordinates = null;

        if (coordinates) { // If coordinates are explicitly sent from frontend (e.g., from geolocation)
            try {
                const parsedCoordinates = JSON.parse(coordinates); // Expected: [longitude, latitude]
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && 
                    typeof parsedCoordinates[0] === 'number' && typeof parsedCoordinates[1] === 'number') {
                    newCoordinates = parsedCoordinates;
                }
            } catch (e) {
                console.warn("Failed to parse coordinates from frontend, attempting geocoding by address.");
            }
        }
        
        // If coordinates not provided or parsed, try to geocode the address
        if (!newCoordinates && address && address.trim() !== '') {
            const geoResult = await geocodeAddress(address); // Call the new geocoding helper
            if (geoResult) {
                newCoordinates = [geoResult.lon, geoResult.lat]; // Nominatim returns lat, lon, MongoDB expects lon, lat
            } else {
                console.warn(`Could not geocode address: "${address}". Location coordinates might remain unchanged or default.`);
            }
        }

        // Update user.location if newCoordinates were found
        if (newCoordinates) {
            user.location = {
                type: 'Point',
                coordinates: newCoordinates
            };
        } else if (address === '' && user.location && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)) {
            // If address is explicitly cleared and old location was not [0,0], reset coordinates to [0,0]
            user.location = {
                type: 'Point',
                coordinates: [0, 0]
            };
        }
        // --- END NEW/MODIFIED LOGIC ---

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
        // Handle unique email constraint violation
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Delete uploaded file if email conflict
            if (req.file) {
                const filePath = path.join(__dirname, '../../', req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return res.status(400).json({ success: false, message: 'Email address is already in use.' });
        }
        // Delete uploaded file for other server errors
        if (req.file) {
            const filePath = path.join(__dirname, '../../', req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile
};