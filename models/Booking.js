const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // --- NEW REQUIRED FIELD ---
        // This creates a direct link to the specific service being booked.
        // This is necessary to ensure reviews are tied to the correct service.
        service: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
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
        serviceType: { // You can keep this for display purposes if you like
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
        totalCost: {
            type: Number,
            required: true
        },
        discountApplied: {
            type: Boolean,
            default: false
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        finalAmount: {
            type: Number,
            required: true
        },
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
        },
        // --- NEW FIELD FOR REVIEWS ---
        reviewSubmitted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
