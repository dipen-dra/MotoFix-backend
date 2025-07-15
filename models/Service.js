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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);