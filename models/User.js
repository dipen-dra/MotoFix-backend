// models/User.js
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: "normal" // Can be 'normal' or 'admin'
        },
        phone: {
            type: String,
            default: ""
        },
        address: {
            type: String,
            default: ""
        },
        profilePicture: {
            type: String,
            default: ""
        },
        loyaltyPoints: {
            type: Number,
            default: 0
        },
        // --- NEW FIELD: For storing user's geographical location ---
        location: {
            type: {
                type: String,
                enum: ['Point'], // GeoJSON Point type
                default: 'Point',
            },
            coordinates: { // [longitude, latitude]
                type: [Number],
                default: [0, 0], // Default to [0, 0] or null
                index: '2dsphere' // Create a geospatial index
            }
        },
        // --- NEW FIELD: Link admin users to a specific workshop ---
        workshop: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            // This is optional; a 'normal' user won't have a workshop.
            // An 'admin' user, however, should be associated with one.
            // We'll enforce this in controllers/middleware.
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);