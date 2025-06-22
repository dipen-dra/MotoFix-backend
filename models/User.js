// const mongoose = require("mongoose")

// const Schema = mongoose.Schema

// const UserSchema = new Schema(
//     {
//         // username: {
//         //     type: String,
//         //     required: true,
//         //     unique: true
//         // },
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
//         }
//     },
//     { timestamps: true }
// )

// module.exports = mongoose.model("User", UserSchema)


const mongoose = require("mongoose")

const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        // username: {
        //     type: String,
        //     required: true,
        //     unique: true
        // },
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
            default: "normal"
        },
        phone: {
            type: String,
            default: ""
        },
        profilePicture: {
            type: String,
            default: ""
        }

    },
    { timestamps: true }
)

module.exports = mongoose.model("User", UserSchema)