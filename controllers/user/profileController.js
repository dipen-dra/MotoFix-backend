// const User = require('../../models/User');

// /**
//  * @desc    Get user profile
//  * @route   GET /api/user/profile
//  * @access  Private
//  */
// const getUserProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password');
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }
//         res.json({ success: true, data: user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// /**
//  * @desc    Update user profile
//  * @route   PUT /api/user/profile
//  * @access  Private
//  */
// const updateUserProfile = async (req, res) => {
//     const { fullName, email, phone } = req.body;

//     try {
//         const user = await User.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         user.fullName = fullName || user.fullName;
//         user.email = email || user.email;
//         user.phone = phone || user.phone;

//         // CORRECTED: Handle file upload
//         if (req.file) {
//             // Use the path provided by Multer, ensuring it's web-friendly
//             user.profilePicture = req.file.path.replace(/\\/g, "/"); 
//         }
        
//         const updatedUser = await user.save();
//         const userResponse = updatedUser.toObject();
//         delete userResponse.password;

//         res.json({ success: true, data: userResponse, message: "Profile updated successfully." });
//     } catch (error) {
//         console.error(error);
//         // Handle potential duplicate email error
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
    // Destructure 'address' from req.body
    const { fullName, email, phone, address } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        // Update the user's address. Allows it to be set to an empty string.
        user.address = address !== undefined ? address : user.address;

        if (req.file) {
            user.profilePicture = req.file.path.replace(/\\/g, "/"); 
        }
        
        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({ success: true, data: userResponse, message: "Profile updated successfully." });
    } catch (error) {
        console.error(error);
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