// File: controllers/admin/profileController.js
// --- FINAL CORRECTED FILE ---

const Workshop = require('../../models/Workshop');
const User = require('../../models/User');
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

// Helper to build the full, absolute image URL for the frontend
const buildFullImageUrl = (req, relativePath) => {
    if (!relativePath) return null;
    // Constructs a URL like: http://localhost:5050/uploads/profilePictures/image.png
    return `${req.protocol}://${req.get('host')}/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// GET /api/admin/profile
exports.getProfile = async (req, res) => {
    try {
        let workshop = null;

        if (req.user.role === 'admin') {
            workshop = await Workshop.findById(req.user.workshop);
            if (!workshop) {
                workshop = new Workshop({
                    ownerName: req.user.fullName || 'Admin User',
                    workshopName: `${req.user.fullName || 'My'} Workshop`,
                    email: req.user.email,
                });
                await workshop.save();
                req.user.workshop = workshop._id;
                await req.user.save();
            }
        } else if (req.user.role === 'superadmin') {
            workshop = await Workshop.findOne();
            if (!workshop) {
                workshop = new Workshop({
                    ownerName: req.user.fullName,
                    workshopName: "SuperAdmin's Main Profile",
                    email: req.user.email
                });
                await workshop.save();
            }
        } else {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop profile not found." });
        }
        
        // Convert to a plain object and add the full URL before sending
        const workshopResponse = workshop.toObject();
        workshopResponse.profilePictureUrl = buildFullImageUrl(req, workshopResponse.profilePicture);
        res.status(200).json({ success: true, data: workshopResponse });

    } catch (error) {
        console.error("Admin getProfile Error:", error);
        res.status(500).json({ success: false, message: "Server error getting profile." });
    }
};


// PUT /api/admin/profile
exports.updateProfile = async (req, res) => {
    const uploadsRootDir = path.join(__dirname, '../../uploads'); 
    const uploadedFilePath = req.file ? req.file.path : null;

    try {
        const workshopIdToUpdate = req.user.workshop;

        if (req.user.role !== 'admin' || !workshopIdToUpdate) {
            safeDeleteFile(uploadedFilePath);
            return res.status(403).json({ success: false, message: "Access denied or not linked to a workshop." });
        }

        const workshop = await Workshop.findById(workshopIdToUpdate);
        if (!workshop) {
            safeDeleteFile(uploadedFilePath);
            return res.status(404).json({ success: false, message: "Workshop profile not found." });
        }
        
        const updateData = { ...req.body };

        if (req.body.coordinates) { 
            try {
                const parsedCoordinates = JSON.parse(req.body.coordinates);
                if (Array.isArray(parsedCoordinates) && parsedCoordinates.length === 2 && !isNaN(parsedCoordinates[0]) && !isNaN(parsedCoordinates[1])) {
                   updateData.location = { type: "Point", coordinates: parsedCoordinates };
                }
            } catch (e) {
                console.warn("Could not parse coordinates. Geocoding will be attempted if address exists.");
            }
        }
        
        if (req.file) {
            if (workshop.profilePicture) {
                const oldImagePath = path.join(uploadsRootDir, workshop.profilePicture);
                safeDeleteFile(oldImagePath);
            }
            updateData.profilePicture = path.relative(uploadsRootDir, uploadedFilePath).replace(/\\/g, '/');
        }
        
        const updatedWorkshop = await Workshop.findByIdAndUpdate(workshopIdToUpdate, updateData, { new: true });

        // Convert the updated document and add the full URL before sending
        const workshopResponse = updatedWorkshop.toObject();
        workshopResponse.profilePictureUrl = buildFullImageUrl(req, workshopResponse.profilePicture);
        res.status(200).json({ success: true, message: "Workshop profile updated successfully.", data: workshopResponse });
        
    } catch (error) {
        safeDeleteFile(uploadedFilePath);
        console.error("Admin updateProfile Error:", error);
        res.status(500).json({ success: false, message: "Server error while updating profile." });
    }
};