// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const BookingSchema = new Schema(
//     {
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
//         totalCost: {
//             type: Number,
//             required: true
//         },
//         user: {
//             type: Schema.Types.ObjectId,
//             ref: 'User'
//         }
//     },
//     { timestamps: true }
// );

// module.exports = mongoose.model("Booking", BookingSchema);



const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true // Ensure this field is required
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
        totalCost: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);