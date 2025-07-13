// models/Workshop.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkshopSchema = new Schema(
    {
        ownerName: {
            type: String,
            required: true
        },
        workshopName: {
            type: String,
            required: true,
            unique: true 
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
            type: String 
        },
        profilePicture: {
            type: String 
        },
        location: {
            type: {
                type: String,
                enum: ['Point'], 
                default: 'Point',
            },
            coordinates: { // [longitude, latitude]
                type: [Number],
                default: [0, 0], 
                index: '2dsphere' 
            }
        },
        pickupDropoffAvailable: {
            type: Boolean,
            default: false
        },
        pickupDropoffCostPerKm: {
            type: Number,
            default: 0 
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Workshop", WorkshopSchema);