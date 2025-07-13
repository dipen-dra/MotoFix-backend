// controllers/admin/workshopManagementController.js
const Workshop = require('../../models/Workshop');
const User = require('../../models/User');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');
const { geocodeAddress } = require('../../utils/geocoding');

exports.getAllWorkshops = async (req, res) => {
    try {
        const workshops = await Workshop.find({});
        res.status(200).json({ success: true, data: workshops });
    } catch (error) {
        console.error("Admin getAllWorkshops Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.getWorkshopById = async (req, res) => {
    try {
        const workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop not found." });
        }
        res.status(200).json({ success: true, data: workshop });
    } catch (error) {
        console.error("Admin getWorkshopById Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.createWorkshop = async (req, res) => {
    const { ownerName, workshopName, email, phone, address, latitude, longitude, pickupDropoffAvailable, pickupDropoffCostPerKm } = req.body;

    if (!ownerName || !workshopName || !email) {
        return res.status(400).json({ success: false, message: "Owner Name, Workshop Name, and Email are required." });
    }

    try {
        const existingWorkshop = await Workshop.findOne({ $or: [{ workshopName }, { email }] });
        if (existingWorkshop) {
            return res.status(400).json({ success: false, message: "Workshop with this name or email already exists." });
        }

        let coordinates = null;
        if (latitude && longitude) {
            coordinates = [parseFloat(longitude), parseFloat(latitude)];
        } else if (address) {
            const geoResult = await geocodeAddress(address);
            if (geoResult) {
                coordinates = [geoResult.lon, geoResult.lat];
            }
        }

        const newWorkshop = new Workshop({
            ownerName,
            workshopName,
            email,
            phone,
            address,
            location: coordinates ? { type: "Point", coordinates } : { type: "Point", coordinates: [0,0] },
            pickupDropoffAvailable: pickupDropoffAvailable || false,
            pickupDropoffCostPerKm: pickupDropoffCostPerKm || 0
        });

        await newWorkshop.save();
        res.status(201).json({ success: true, message: "Workshop created successfully.", data: newWorkshop });

    } catch (error) {
        console.error("Admin createWorkshop Error:", error);
        res.status(500).json({ success: false, message: "Server error during workshop creation.", error: error.message });
    }
};

exports.updateWorkshop = async (req, res) => {
    const { ownerName, workshopName, email, phone, address, latitude, longitude, pickupDropoffAvailable, pickupDropoffCostPerKm } = req.body;

    try {
        let workshop = await Workshop.findById(req.params.id);
        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop not found." });
        }

        if (workshopName && workshopName !== workshop.workshopName) {
            const existingByName = await Workshop.findOne({ workshopName });
            if (existingByName && !existingByName._id.equals(workshop._id)) {
                return res.status(400).json({ success: false, message: "Another workshop with this name already exists." });
            }
        }
        if (email && email !== workshop.email) {
            const existingByEmail = await Workshop.findOne({ email });
            if (existingByEmail && !existingByEmail._id.equals(workshop._id)) {
                return res.status(400).json({ success: false, message: "Another workshop with this email already exists." });
            }
        }

        workshop.ownerName = ownerName !== undefined ? ownerName : workshop.ownerName;
        workshop.workshopName = workshopName !== undefined ? workshopName : workshop.workshopName;
        workshop.email = email !== undefined ? email : workshop.email;
        workshop.phone = phone !== undefined ? phone : workshop.phone;
        workshop.address = address !== undefined ? address : workshop.address;
        workshop.pickupDropoffAvailable = pickupDropoffAvailable !== undefined ? pickupDropoffAvailable : workshop.pickupDropoffAvailable;
        workshop.pickupDropoffCostPerKm = pickupDropoffCostPerKm !== undefined ? pickupDropoffCostPerKm : workshop.pickupDropoffCostPerKm;

        let newCoordinates = null;
        if (latitude && longitude) {
            newCoordinates = [parseFloat(longitude), parseFloat(latitude)];
        } else if (address !== undefined) {
            const geoResult = await geocodeAddress(address);
            if (geoResult) {
                newCoordinates = [geoResult.lon, geoResult.lat];
            } else if (address === '') {
                 newCoordinates = [0,0];
            }
        }
        if (newCoordinates) {
            workshop.location = { type: "Point", coordinates: newCoordinates };
        } else if (address === '' && workshop.location && (workshop.location.coordinates[0] !== 0 || workshop.location.coordinates[1] !== 0)) {
            workshop.location = { type: "Point", coordinates: [0,0] };
        }

        await workshop.save();
        res.status(200).json({ success: true, message: "Workshop updated successfully.", data: workshop });

    } catch (error) {
        console.error("Admin updateWorkshop Error:", error);
        res.status(500).json({ success: false, message: "Server error during workshop update.", error: error.message });
    }
};

exports.deleteWorkshop = async (req, res) => {
    try {
        const workshop = await Workshop.findByIdAndDelete(req.params.id);
        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop not found." });
        }

        await Service.deleteMany({ workshop: workshop._id });
        await Booking.updateMany({ workshop: workshop._id }, { $set: { workshop: null, status: 'Cancelled', notes: 'Workshop deleted' } });
        await User.updateMany({ workshop: workshop._id }, { $set: { workshop: null, role: 'normal' } });

        res.status(200).json({ success: true, message: "Workshop and associated data deleted successfully." });

    } catch (error) {
        console.error("Admin deleteWorkshop Error:", error);
        res.status(500).json({ success: false, message: "Server error during workshop deletion.", error: error.message });
    }
};