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
            enum: ['normal', 'admin', 'superadmin'], // Added 'superadmin' enum for clarity
            default: "normal" 
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
        workshop: {
            type: Schema.Types.ObjectId,
            ref: 'Workshop',
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);