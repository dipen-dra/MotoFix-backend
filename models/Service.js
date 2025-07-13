// models/Service.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { 
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
        type: String, 
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
    workshop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workshop',
        required: true 
    }
}, {
    timestamps: true
});

serviceSchema.index({ name: 1, workshop: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);