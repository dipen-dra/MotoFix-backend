const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs"); // <-- THE FIX: Import the 'fs' module

// Define the storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = path.join(__dirname, '../uploads/'); // Base directory

        // Determine the specific subfolder based on the form field's name
        if (file.fieldname === 'profilePicture') {
            uploadDir = path.join(__dirname, '../uploads/profilePictures/');
        } else if (file.fieldname === 'companyDocumentImage') {
            uploadDir = path.join(__dirname, '../uploads/companyDocuments/');
        } else if (file.fieldname === 'image') { // For service images
            uploadDir = path.join(__dirname, '../uploads/serviceImages/');
        } else if (file.fieldname === 'file') { // For chat files
             uploadDir = path.join(__dirname, '../uploads/chat/');
        }

        // Use fs.mkdirSync to create the directory if it doesn't exist.
        // The { recursive: true } option ensures that parent directories are also created.
        fs.mkdirSync(uploadDir, { recursive: true });
        
        // Pass the determined directory to the callback
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent overwriting files with the same name
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

// Define a filter to control which files are accepted
const fileFilter = (req, file, cb) => {
    // Define allowed MIME types for different purposes
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedChatFileTypes = [...allowedImageTypes, ...allowedDocumentTypes, 'video/mp4', 'audio/mpeg', 'audio/wav'];

    let allowedMimeTypes;

    // Select the correct set of allowed types based on the field name
    if (file.fieldname === 'companyDocumentImage') {
        allowedMimeTypes = [...allowedImageTypes, ...allowedDocumentTypes]; // Allow images and PDFs/Docs for company docs
    } else if (file.fieldname === 'file') { // For chat
        allowedMimeTypes = allowedChatFileTypes;
    } else { // Default to images for profile pictures, service images, etc.
        allowedMimeTypes = allowedImageTypes;
    }
    
    // Check if the uploaded file's MIME type is in the allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        // Reject the file with a specific error message
        cb(new Error("Invalid file type! Please upload a supported file."), false);
    }
};

// Create the multer instance with the storage, limits, and filter configurations
const fileupload = multer({
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10 MB file size limit
    }, 
    fileFilter: fileFilter 
});

// Export the configured multer instance directly
// This allows you to use it as `fileupload.single(...)` or `fileupload.array(...)` in your routes
module.exports = fileupload;