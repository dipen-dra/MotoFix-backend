const Service = require("../../models/Service");
const Workshop = require('../../models/Workshop'); // Import Workshop model
const User = require('../../models/User'); // Import User model to get user's location

/**
 * @desc    Get all available services (MODIFIED: Refactored to use aggregation pipeline for $geoNear)
 * @route   GET /api/user/services
 * @access  Private
 * @query   lat, lon, radiusKm (optional, for proximity search)
 */
exports.getAvailableServices = async (req, res) => {
    try {
        const { lat, lon, radiusKm } = req.query; // Query parameters for location-based search

        let services = [];

        if (lat && lon && radiusKm) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const searchRadius = parseFloat(radiusKm); // in kilometers

            if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius) || searchRadius <= 0) {
                return res.status(400).json({ success: false, message: "Invalid location or radius parameters." });
            }

            // --- REFACTORED: Use aggregation pipeline with $geoNear for robust geospatial query ---
            const nearbyWorkshops = await Workshop.aggregate([
                {
                    $geoNear: {
                        near: { type: "Point", coordinates: [userLon, userLat] },
                        distanceField: "distance", // Output field that contains the distance
                        maxDistance: searchRadius * 1000, // Convert km to meters
                        spherical: true // Treat earth as a sphere for accurate calculation
                        // Optionally, add a query for other filters directly in $geoNear
                        // query: { "location.coordinates": { "$ne": [0,0] } } // This filter works better here if needed
                    }
                },
                {
                    // Add an explicit filter for coordinates not being [0,0] AFTER $geoNear
                    // This ensures $geoNear uses the index cleanly first, then filters.
                    $match: {
                        "location.coordinates": { "$ne": [0,0] }
                    }
                },
                {
                    // Project only the necessary fields from the workshop and add distance
                    $project: {
                        _id: 1,
                        workshopName: 1,
                        address: 1,
                        phone: 1,
                        pickupDropoffAvailable: 1,
                        pickupDropoffCostPerKm: 1,
                        location: 1, // Keep location for further use if needed
                        distance: { $divide: ["$distance", 1000] } // Convert meters to km
                    }
                },
                {
                    // Sort by distance (optional, but good for "nearby" results)
                    $sort: { "distance": 1 }
                }
            ]);

            const nearbyWorkshopIds = nearbyWorkshops.map(w => w._id);

            // If no nearby workshops, return empty array
            if (nearbyWorkshopIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }

            // Find services belonging to these nearby workshops
            // Populate workshop details as before, and include the distance calculated from aggregation
            services = await Service.find({ workshop: { $in: nearbyWorkshopIds } })
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location') // Populate workshop details including location
                                    .sort({ createdAt: -1 });

            // Attach the calculated distance to each service based on its workshop
            services = services.map(service => {
                const workshopWithDistance = nearbyWorkshops.find(w => w._id.equals(service.workshop._id));
                const distance = workshopWithDistance ? parseFloat(workshopWithDistance.distance.toFixed(2)) : null;
                return { ...service.toObject(), distance: distance };
            });

        } else {
            // If no location/radius provided, return services from all workshops
            services = await Service.find({})
                                    .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location') // Also populate location here
                                    .sort({ createdAt: -1 });
        }
        
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        // IMPORTANT: Log the full error object on the server for detailed debugging
        console.error("User getAvailableServices Error:", error); 
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

/**
 * @desc    Get a single service by its ID with populated review author details
 * @route   GET /api/user/services/:id
 * @access  Private
 * @MODIFIED: Also populate workshop details including its location
 */
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate({
                path: 'reviews.user', 
                select: 'fullName profilePicture' 
            })
            .populate('workshop', 'workshopName address phone pickupDropoffAvailable pickupDropoffCostPerKm location'); // Populate workshop details including location
        
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