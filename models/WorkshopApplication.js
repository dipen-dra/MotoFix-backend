// models/WorkshopApplication.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkshopApplicationSchema = new Schema(
    {
        user: { 
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true 
        },
        workshopName: {
            type: String,
            required: true,
            trim: true
        },
        ownerName: { 
            type: String,
            required: true,
            trim: true
        },
        email: { 
            type: String,
            required: true,
            unique: true 
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        companyDocumentImage: { // NEW: For the company document image
            type: String, 
            required: [true, "Company document image is required for application."]
        },
        notes: { 
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        superadminNotes: { 
            type: String,
            trim: true,
            default: ''
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('WorkshopApplication', WorkshopApplicationSchema);