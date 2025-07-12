// models/Workshop.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkshopSchema = new Schema(
    {
        // Renamed 'ownerName' and 'workshopName' for clarity, assuming they map directly
        // to the admin's profile for that workshop.
        // We'll enforce that only ONE workshop exists for a given admin user.
        // For simplicity, we won't directly reference the User model here with 'required:true'
        // This allows a workshop to exist before an admin is assigned, or for test data.
        ownerName: {
            type: String,
            required: true
        },
        workshopName: {
            type: String,
            required: true,
            unique: true // Ensure workshop names are unique
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        phone: {
            type: String
        },
        address: {
            type: String // Human-readable address
        },
        profilePicture: {
            type: String // Path to workshop's profile picture/logo
        },
        // --- NEW FIELD: For storing workshop's geographical location ---
        location: {
            type: {
                type: String,
                enum: ['Point'], // GeoJSON Point type
                default: 'Point',
            },
            coordinates: { // [longitude, latitude]
                type: [Number],
                default: [0, 0], // Default coordinates, e.g., for center of Nepal or null
                index: '2dsphere' // Create a geospatial index for proximity queries
            }
        },
        // --- NEW FIELDS: Pickup/Drop-off service options ---
        pickupDropoffAvailable: {
            type: Boolean,
            default: false
        },
        pickupDropoffCostPerKm: {
            type: Number,
            default: 0 // Cost per km for pickup/drop-off
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Workshop", WorkshopSchema);