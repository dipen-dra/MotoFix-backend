const Service = require("../../models/Service");
const fs = require('fs'); // ⭐️ 1. Import Node.js file system module
const path = require('path'); // ⭐️ 2. Import Node.js path module

// Get all services with pagination (This function is already correct)
exports.getServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const query = {};
        const totalItems = await Service.countDocuments(query);
        const services = await Service.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.status(200).json({
            success: true,
            data: services,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// --- UPDATED FUNCTIONS ---

// CREATE a new service with an image
exports.createService = async (req, res) => {
    // Data comes from the form body
    const { name, description, price } = req.body;

    // ⭐️ 3. Check if an image file was uploaded by multer
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Service image is required." });
    }

    if (!name || !price) {
        // If validation fails, delete the uploaded file to prevent clutter
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Name and price are required." });
    }
    
    try {
        const newService = new Service({
            name,
            description,
            price,
            image: req.file.path // ⭐️ 4. Save the path of the uploaded file
        });
        await newService.save();
        res.status(201).json({ success: true, message: "Service created successfully.", data: newService });
    } catch (error) {
        // If the database save fails, also delete the uploaded file
        if (req.file) {
           fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Failed to create service", error: error.message });
    }
};

// UPDATE a service, with optional new image
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            // If service not found and a file was uploaded, delete the new file
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        const updateData = { ...req.body };

        // ⭐️ 5. If a new image is uploaded...
        if (req.file) {
            // ...delete the old image from the server
            if (service.image && fs.existsSync(service.image)) {
                fs.unlinkSync(service.image);
            }
            // ...and set the path for the new image.
            updateData.image = req.file.path;
        }

        const updatedService = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: "Service updated successfully.", data: updatedService });

    } catch (error) {
        // If update fails and a new file was uploaded, delete it
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// DELETE a service and its associated image
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        // ⭐️ 6. Delete the image file from the 'uploads' folder
        if (service.image && fs.existsSync(service.image)) {
            fs.unlinkSync(service.image);
        }

        // Now delete the service record from the database
        await Service.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};