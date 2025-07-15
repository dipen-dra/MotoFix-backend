
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
            required: true
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
        offerPickupDropoff: {
            type: Boolean,
            default: false
        },
        pickupDropoffChargePerKm: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Workshop", WorkshopSchema);