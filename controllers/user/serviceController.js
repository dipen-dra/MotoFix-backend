// controllers/user/serviceController.js
const Service = require("../../models/Service");
const Workshop = require('../../models/Workshop');
const User = require('../../models/User');

exports.getAvailableServices = async (req, res) => {
    try {
        const { lat, lon, radiusKm } = req.query;

        let services = [];

        if (lat && lon && radiusKm) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const searchRadius = parseFloat(radiusKm);

            if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius) || searchRadius <= 0) {
                return res.status(400).json({ success: false, message: "Invalid location or radius parameters." });
            }

            const nearbyWorkshops = await Workshop.aggregate([
                {
                    $geoNear: {
                        near: { type: "Point", coordinates: [userLon, userLat] },
                        distanceField: "distance",
                        maxDistance: searchRadius * 1000,
                        spherical: true
                    }
                },
                {
                    $match: {
                        "location.coordinates": { "$ne": [0,0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        workshopName: 1,
                        address: 1,
                        phone: 1,
                        pickupDropoffAvailable: 1,
                        pickupDropoffCostPerKm: 1,
                        location: 1,
                        distance: { $divide: ["$distance", 1000] }
                    }
                },
                {
                    $sort: { "distance": 1 }
                }
            ]);

            const nearbyWorkshopIds = nearbyWorkshops.map(w => w._id);

            if (nearbyWorkshopIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }

            services = await Service.find({ workshop: { $in: nearbyWorkshopIds } })
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location')
                                    .sort({ createdAt: -1 });

            services = services.map(service => {
                const workshopWithDistance = nearbyWorkshops.find(w => w._id.equals(service.workshop._id));
                const distance = workshopWithDistance ? parseFloat(workshopWithDistance.distance.toFixed(2)) : null;
                return { ...service.toObject(), distance: distance };
            });

        } else {
            services = await Service.find({})
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location')
                                    .sort({ createdAt: -1 });
        }
        
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error("User getAvailableServices Error:", error); 
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user', 
                select: 'fullName profilePicture' 
            })
            .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location');
        
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }
        
        res.status(200).json({
            success: true,
            data: service 
        });
    } catch (error) {
        console.error("User getServiceById Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};