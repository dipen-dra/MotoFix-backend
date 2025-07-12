const Workshop = require('../../models/Workshop');
const User = require('../../models/User'); // Import User model to update admin's workshop field
const { single } = require('../../middlewares/fileupload'); // Assuming this is for generic file uploads

// Get workshop profile (linked to the admin user)
exports.getProfile = async (req, res) => {
    try {
        const adminId = req.user._id;

        // Find the workshop linked to this admin user
        let workshop = await Workshop.findOne({ _id: req.user.workshop }); // req.user.workshop is populated by authenticateUser

        if (!workshop) {
            // If no workshop is linked, check if one exists with the admin's email (legacy)
            // Or create a new default one and link it.
            workshop = await Workshop.findOne({ email: req.user.email });
            if (!workshop) {
                // Create a default workshop profile and link it to the admin
                workshop = new Workshop({
                    ownerName: req.user.fullName || 'Admin User',
                    workshopName: `${req.user.fullName || 'My'} Workshop`, // Dynamic default name
                    email: req.user.email,
                    phone: req.user.phone || '',
                    address: req.user.address || ''
                });
                await workshop.save();
            }
            // Link the workshop to the admin user
            req.user.workshop = workshop._id;
            await req.user.save();
            // Re-populate req.user so that the workshop is available for subsequent middleware/controllers
            req.user = await User.findById(adminId).populate('workshop');
        }
        
        // Return the workshop data, not the user data for the "profile" endpoint
        res.status(200).json({ success: true, data: workshop });
    } catch (error) {
        console.error("Admin getProfile Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Update workshop profile (linked to the admin user)
exports.updateProfile = async (req, res) => {
    try {
        const workshopId = req.workshopId; // Set by isWorkshopAdmin middleware
        if (!workshopId) {
            return res.status(403).json({ success: false, message: "Admin not linked to a workshop." });
        }

        let workshop = await Workshop.findById(workshopId);
        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop profile not found." });
        }
        
        const updateData = { ...req.body };

        // Handle GeoJSON location update
        if (req.body.coordinates) {
            try {
                const parsedCoordinates = JSON.parse(req.body.coordinates); // Should be [longitude, latitude]
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && typeof parsedCoordinates[0] === 'number' && typeof parsedCoordinates[1] === 'number') {
                    updateData.location = {
                        type: 'Point',
                        coordinates: parsedCoordinates
                    };
                    // console.log("Updating workshop location:", updateData.location);
                } else {
                    console.warn("Invalid coordinates format received:", req.body.coordinates);
                    delete updateData.coordinates; // Remove invalid coordinates to prevent Mongoose error
                }
            } catch (e) {
                console.warn("Failed to parse coordinates:", req.body.coordinates, e);
                delete updateData.coordinates;
            }
        } else if (updateData.address) {
            // If address is updated but no coordinates, might imply manual address change without location API
            // We can choose to keep existing coordinates or set them to default/null if address changes.
            // For now, if address is updated, but no new coordinates, old coordinates remain.
        }


        if (req.file) {
            // Delete old profile picture if it exists
            if (workshop.profilePicture) {
                const oldImagePath = path.join(__dirname, '../../', workshop.profilePicture);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.profilePicture = req.file.path.replace(/\\/g, "/");
        }

        // Update specific fields that can be changed by the admin
        workshop.ownerName = updateData.ownerName !== undefined ? updateData.ownerName : workshop.ownerName;
        workshop.workshopName = updateData.workshopName !== undefined ? updateData.workshopName : workshop.workshopName;
        workshop.email = updateData.email !== undefined ? updateData.email : workshop.email;
        workshop.phone = updateData.phone !== undefined ? updateData.phone : workshop.phone;
        workshop.address = updateData.address !== undefined ? updateData.address : workshop.address;
        workshop.profilePicture = updateData.profilePicture !== undefined ? updateData.profilePicture : workshop.profilePicture;
        workshop.location = updateData.location !== undefined ? updateData.location : workshop.location;
        workshop.pickupDropoffAvailable = updateData.pickupDropoffAvailable !== undefined ? updateData.pickupDropoffAvailable : workshop.pickupDropoffAvailable;
        workshop.pickupDropoffCostPerKm = updateData.pickupDropoffCostPerKm !== undefined ? updateData.pickupDropoffCostPerKm : workshop.pickupDropoffCostPerKm;


        await workshop.save();

        res.status(200).json({ success: true, message: "Workshop profile updated.", data: workshop });
    } catch (error) {
        console.error("Admin updateProfile Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Middleware for single file upload
exports.uploadProfilePicture = single('profilePicture');