// models/Booking.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        customerName: {
            type: String,
            required: true
        },
        bikeModel: {
            type: String,
            required: true
        },
        serviceType: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
            default: 'Pending'
        },
        date: {
            type: Date,
            required: true
        },
        notes: {
            type: String,
            default: ''
        },
        totalCost: { // This will be the original cost of the service
            type: Number,
            required: true
        },
        // --- NEW FIELDS START ---
        discountApplied: {
            type: Boolean,
            default: false
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        finalAmount: { // This will be the cost after discount
            type: Number,
            required: true
        },
        // --- NEW FIELDS END ---
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
        isPaid: {
            type: Boolean,
            default: false
        },
        pointsAwarded: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);