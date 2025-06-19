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
    const { fullName, email, phone } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        if (req.file) {
            user.profilePicture = `uploads/users/${req.file.filename}`;
        }
        
        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({ success: true, data: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile
};