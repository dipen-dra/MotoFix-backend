
// const mongoose = require("mongoose")

// const Schema = mongoose.Schema

// const UserSchema = new Schema(
//     {
//         fullName: {
//             type: String,
//             required: true
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true
//         },
//         password: {
//             type: String,
//             required: true
//         },
//         role: {
//             type: String,
//             default: "normal"
//         },
//         phone: {
//             type: String,
//             default: ""
//         },
//         address: {
//             type: String,
//             default: ""
//         },
//         profilePicture: {
//             type: String,
//             default: ""
//         }

//     },
//     { timestamps: true }
// )

// module.exports = mongoose.model("User", UserSchema)


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
            default: "normal" // Can be 'normal' or 'admin'
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
        // NEW FIELD
        loyaltyPoints: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);