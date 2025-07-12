// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, "Service name is required."],
//         trim: true,
//         unique: true
//     },
//     description: {
//         type: String,
//         required: [true, "Service description is required."],
//         trim: true
//     },
//     price: {
//         type: Number,
//         required: [true, "Service price is required."]
//     },
//     duration: {
//             type: String
//         },
//     // --- NEW FIELD ADDED ---
//     image: {
//         type: String, // We will store the path to the image
//         required: [true, "Service image is required."]
//     }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Service', serviceSchema);


// models/Service.js
const mongoose = require('mongoose');

// Define the review schema first, as it will be embedded within the Service.
const reviewSchema = new mongoose.Schema({
    user: { // Changed from 'customer' to 'user' to align with User model ref
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { timestamps: true });


const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Service name is required."],
        trim: true,
        // Removed unique: true here. Two workshops can have a 'General Service'
        // We'll enforce uniqueness per workshop in controllers if needed.
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
    image: {
        type: String, // Path to the image
        required: [true, "Service image is required."]
    },
    reviews: [reviewSchema],
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0
    },
    // --- NEW FIELD: Link service to a specific workshop ---
    workshop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workshop',
        required: true // Every service must belong to a workshop
    }
}, {
    timestamps: true
});

// Optional: Add a compound unique index if you want to ensure a service name is unique PER workshop
serviceSchema.index({ name: 1, workshop: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);