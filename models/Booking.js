;const mongoose = require("mongoose");
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
        totalCost: {
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
            enum: ['COD', 'Khalti', 'eSewa', 'Not Selected'], // 'eSewa' is now a valid option
            default: 'Not Selected'
        },
        isPaid: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);