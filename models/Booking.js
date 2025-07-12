// models/Booking.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
    {
        customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        // --- NEW FIELD: Link booking to a specific workshop ---
        workshop: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true },
        // --- EXISTING FIELDS (keep as is) ---
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
        // --- NEW FIELDS: For pickup/drop-off functionality ---
        pickupDropoffRequested: { // true if user requested pickup/drop-off service
            type: Boolean,
            default: false
        },
        pickupDropoffAddress: { // If different from user's primary address
            type: String,
            default: ''
        },
        pickupDropoffCost: { // Calculated cost for pickup/drop-off
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);