const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Service name is required."],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, "Service description is required."],
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Service price is required."]
    },
    duration: {
            type: String
        },
    // --- NEW FIELD ADDED ---
    image: {
        type: String, // We will store the path to the image
        required: [true, "Service image is required."]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);