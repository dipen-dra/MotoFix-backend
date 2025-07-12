const Service = require("../../models/Service");
const Workshop = require('../../models/Workshop'); // Import Workshop model
const User = require('../../models/User'); // Import User model to get user's location

/**
 * @desc    Get all available services (MODIFIED: Now fetches services for ALL workshops, potentially filtered by user location)
 * @route   GET /api/user/services
 * @access  Private
 * @query   lat, lon, radiusKm (optional, for proximity search)
 */
exports.getAvailableServices = async (req, res) => {
    try {
        const { lat, lon, radiusKm } = req.query; // Query parameters for location-based search

        let query = {};
        let services = [];

        if (lat && lon && radiusKm) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const searchRadius = parseFloat(radiusKm); // in kilometers

            if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius) || searchRadius <= 0) {
                return res.status(400).json({ success: false, message: "Invalid location or radius parameters." });
            }

            // Find workshops near the provided coordinates
            const nearbyWorkshops = await Workshop.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [userLon, userLat] // MongoDB expects [longitude, latitude]
                        },
                        $maxDistance: searchRadius * 1000 // Convert km to meters
                    }
                }
            }).select('_id workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm'); // Select necessary workshop fields

            const nearbyWorkshopIds = nearbyWorkshops.map(w => w._id);

            // If no nearby workshops, return empty array
            if (nearbyWorkshopIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }

            // Find services belonging to these nearby workshops
            services = await Service.find({ workshop: { $in: nearbyWorkshopIds } })
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm') // Populate workshop details
                                    .sort({ createdAt: -1 });

            // Attach distance to each service based on its workshop's location to the user's location
            services = services.map(service => {
                let distance = null;
                if (service.workshop?.location?.coordinates && userLon && userLat) {
                    const R = 6371; // Radius of Earth in km
                    const workshopCoords = service.workshop.location.coordinates;
                    const dLat = (userLat - workshopCoords[1]) * Math.PI / 180;
                    const dLon = (userLon - workshopCoords[0]) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(workshopCoords[1] * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    distance = R * c; // Distance in km
                }
                return { ...service.toObject(), distance: distance ? parseFloat(distance.toFixed(2)) : null };
            });

        } else {
            // If no location/radius provided, return services from all workshops
            services = await Service.find({})
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm')
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

/**
 * @desc    Get a single service by its ID with populated review author details
 * @route   GET /api/user/services/:id
 * @access  Private
 * @MODIFIED: Also populate workshop details
 */
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user', 
                select: 'fullName profilePicture' 
            })
            .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm'); // Populate workshop details
        
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