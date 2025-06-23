

// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// // CORRECTED AND FINAL SCHEMA
// const BookingSchema = new Schema(
//     {
//         // This is the correct field name that matches your controllers.
//         customer: {
//             type: Schema.Types.ObjectId,
//             ref: 'User',
//             required: true // Making it required prevents creating bookings without a user.
//         },
//         customerName: {
//             type: String,
//             required: true
//         },
//         bikeModel: {
//             type: String,
//             required: true
//         },
//         serviceType: {
//             type: String,
//             required: true
//         },
//         status: {
//             type: String,
//             enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
//             default: 'Pending'
//         },
//         date: {
//             type: Date,
//             required: true
//         },
//         notes: { // Adding notes field as it's used in the create function
//             type: String,
//             default: ''
//         },
//         totalCost: {
//             type: Number,
//             required: true
//         }
//     },
//     { timestamps: true }
// );

// module.exports = mongoose.model("Booking", BookingSchema);


const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// CORRECTED AND FINAL SCHEMA
const BookingSchema = new Schema(
    {
        // This is the correct field name that matches your controllers.
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true // Making it required prevents creating bookings without a user.
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
        notes: { // Adding notes field as it's used in the create function
            type: String,
            default: ''
        },
        totalCost: {
            type: Number,
            required: true
        },
        // NEW FIELDS ADDED
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'Khalti', 'Not Selected'],
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