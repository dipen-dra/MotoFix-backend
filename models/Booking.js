// models/Booking.js (Updated with pickup/dropoff fields)

// --- CHANGED: Use require instead of import ---
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
    {
        customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        bikeModel: { type: String, required: true },
        customerName: { type: String, required: true },
        serviceType: { type: String, required: true },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
            default: 'Pending'
        },
        date: { type: Date, required: true },
        notes: { type: String, default: '' },
        totalCost: { type: Number, required: true },
        discountApplied: { type: Boolean, default: false },
        discountAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'Khalti', 'eSewa', 'Not Selected'],
            default: 'Not Selected'
        },
        isPaid: { type: Boolean, default: false },
        pointsAwarded: { type: Number, default: 0 },
        reviewSubmitted: { type: Boolean, default: false },
        archivedByAdmin: {
            type: Boolean,
            default: false
        },
        // NEW FIELDS FOR PICKUP/DROPOFF
        requestedPickupDropoff: {
            type: Boolean,
            default: false
        },
        pickupAddress: {
            type: String,
            default: ''
        },
        dropoffAddress: {
            type: String,
            default: ''
        },
        pickupCoordinates: {
            lat: { type: Number },
            lng: { type: Number }
        },
        dropoffCoordinates: {
            lat: { type: Number },
            lng: { type: Number }
        },
        pickupDropoffDistance: {
            type: Number, // In kilometers
            default: 0
        },
        pickupDropoffCost: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// --- CHANGED: Use module.exports instead of export default ---
module.exports = mongoose.model("Booking", BookingSchema);