const WorkshopApplication = require('../../models/WorkshopApplication');
const Workshop = require('../../models/Workshop'); // Ensure this is imported if not already
const User = require('../../models/User'); // Ensure this is imported if not already
const fs = require('fs');
const path = require('path');

exports.applyForWorkshop = async (req, res) => {
    const { workshopName, ownerName, email, phone, address, notes } = req.body;

    // Store the absolute path from Multer for potential deletion
    const uploadedFilePath = req.file ? req.file.path : null; 

    // Helper function to safely delete the uploaded file if an error occurs
    const safeDeleteFile = (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Successfully deleted uploaded file: ${filePath}`);
            } catch (unlinkError) {
                console.error(`Error deleting file ${filePath}:`, unlinkError);
            }
        }
    };

    if (req.user.role !== 'normal') {
        safeDeleteFile(uploadedFilePath);
        return res.status(403).json({ success: false, message: 'Only normal users can apply to be workshop owners.' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Company document image is required for application.' });
    }
    
    // Calculate the relative path for saving to DB
    const uploadsRootDir = path.join(__dirname, '..', '..', 'uploads');
    const relativeCompanyDocumentImagePath = path.relative(uploadsRootDir, uploadedFilePath).replace(/\\/g, '/');

    if (!workshopName || !ownerName || !email || !address) {
        safeDeleteFile(uploadedFilePath);
        return res.status(400).json({ success: false, message: 'Workshop Name, Owner Name, Email, and Address are required for application.' });
    }

    try {
        const existingApplication = await WorkshopApplication.findOne({ user: req.user.id });
        
        if (existingApplication) {
            // If an existing application is found
            if (existingApplication.status === 'Pending') {
                // If it's pending, user cannot re-apply
                safeDeleteFile(uploadedFilePath);
                return res.status(400).json({ success: false, message: 'You already have a pending workshop application. Please wait for review or contact support.' });
            } 
            // If status is 'Rejected' or 'Approved' (though 'Approved' is unlikely to be here)
            // User wants to submit 'another application', so delete the old one.
            else if (existingApplication.status === 'Rejected') { // Explicitly handle 'Rejected'
                // Clean up old document if it exists on server
                if (existingApplication.companyDocumentImage) {
                    safeDeleteFile(path.join(uploadsRootDir, existingApplication.companyDocumentImage));
                }
                // Delete the old application record from DB
                await WorkshopApplication.deleteOne({ _id: existingApplication._id });
                console.log(`Deleted old rejected application for user ${req.user.id}.`);
            } else if (existingApplication.status === 'Approved') {
                // This scenario means a user who is already an admin is trying to apply again.
                // This should generally be prevented, as they are already a workshop owner.
                safeDeleteFile(uploadedFilePath);
                return res.status(400).json({ success: false, message: "You are already a workshop owner/admin. Cannot submit new application." });
            }
        }
        
        // This check should ideally be done AFTER handling existing applications for the user
        const existingWorkshop = await require('../../models/Workshop').findOne({ email: email });
        if (existingWorkshop) {
            safeDeleteFile(uploadedFilePath);
            return res.status(400).json({ success: false, message: 'A workshop with this email already exists.' });
        }

        const newApplication = new WorkshopApplication({
            user: req.user.id,
            workshopName,
            ownerName,
            email,
            phone,
            address,
            companyDocumentImage: relativeCompanyDocumentImagePath, // Save the TRANSFORMED relative path
            notes
        });

        await newApplication.save();
        res.status(201).json({ success: true, message: 'Workshop application submitted successfully. Please wait for review.', data: newApplication });

    } catch (error) {
        safeDeleteFile(uploadedFilePath); // Delete new uploaded file on any save/processing error
        console.error("User applyForWorkshop Error:", error);
        if (error.code === 11000) { 
            // This 11000 error should now ideally only happen if the user somehow has *two* pending applications,
            // or if the unique index is on `email` and an existing workshop uses that email,
            // which is handled by the `existingWorkshop` check.
            // Keeping this catch for robustness but the deletion logic above should mitigate it for `user` field.
            if (error.keyPattern && error.keyPattern.user) {
                return res.status(400).json({ success: false, message: 'An active application already exists for your account. If you believe this is an error, please contact support.' });
            }
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({ success: false, message: 'A workshop application or existing workshop with this email already exists. Please use a different email or contact support.' });
            }
        }
        res.status(500).json({ success: false, message: 'Server error during application submission.' });
    }
};

exports.getMyWorkshopApplication = async (req, res) => {
    if (req.user.role !== 'normal') {
        return res.status(403).json({ success: false, message: 'Only normal users can view application status.' });
    }

    try {
        const application = await WorkshopApplication.findOne({ user: req.user.id }).populate('user', 'fullName email');
        if (!application) {
            return res.status(404).json({ success: false, message: 'No workshop application found for this user.' });
        }
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        console.error("User getMyWorkshopApplication Error:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching application status.' });
    }
};