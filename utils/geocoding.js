// utils/geocoding.js
const fetch = require('node-fetch'); // Ensure node-fetch is installed (npm install node-fetch)

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocodes a human-readable address string to lat/lon coordinates.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<Object|null>} - A promise that resolves to { lat: number, lon: number } or null if not found/error.
 */
exports.geocodeAddress = async (address) => {
    if (!address || typeof address !== 'string' || address.trim() === '') {
        return null;
    }

    try {
        const response = await fetch(`${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        if (!response.ok) {
            console.error(`Nominatim geocoding failed: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();

        if (data && data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lon = parseFloat(firstResult.lon);
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon };
            }
        }
        console.warn(`No coordinates found for address: "${address}"`);
        return null;
    } catch (error) {
        console.error(`Error geocoding address "${address}":`, error);
        return null;
    }
};

/**
 * Reverse geocodes lat/lon coordinates to a human-readable address.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {Promise<string|null>} - A promise that resolves to the address string or null if not found/error.
 */
exports.reverseGeocodeCoordinates = async (lat, lon) => {
    if (isNaN(lat) || isNaN(lon)) {
        return null;
    }

    try {
        const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            console.error(`Nominatim reverse geocoding failed: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();

        if (data && data.display_name) {
            return data.display_name;
        }
        console.warn(`No address found for coordinates: lat=${lat}, lon=${lon}`);
        return null;
    } catch (error) {
        console.error(`Error reverse geocoding coordinates (${lat}, ${lon}):`, error);
        return null;
    }
};