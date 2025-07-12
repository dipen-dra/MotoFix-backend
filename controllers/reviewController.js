/**
 * @file controllers/reviewController.js
 * @description Controller for creating and managing reviews.
 */

import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
// The 'User' import is not strictly necessary here, but we can leave it.
import User from '../models/User.js';

/**
 * @route   POST /api/reviews/:bookingId
 * @desc    Create a new review for a service via a completed booking
 * @access  Private (User)
 */


export const createServiceReview = async (req, res) => {
    const { rating, comment } = req.body;
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findById(bookingId)
            .populate('customer')
            .populate('service');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (!booking.service) {
            return res.status(404).json({ message: 'The service for this booking was not found and cannot be reviewed.' });
        }

        if (booking.customer?._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to review this booking.' });
        }

        if (booking.status !== 'Completed') {
            return res.status(400).json({ message: 'You can only review completed services.' });
        }

        if (booking.reviewSubmitted) {
            return res.status(400).json({ message: 'You have already submitted a review for this service.' });
        }

        const service = booking.service;

        const review = {
            user: req.user.id,
            username: booking.customer?.fullName || 'Anonymous',
            rating: Number(rating),
            comment,
        };

        service.reviews.push(review);
        service.numReviews = service.reviews.length;
        service.rating = service.reviews.reduce((acc, item) => item.rating + acc, 0) / service.reviews.length;

        booking.reviewSubmitted = true;

        await service.save();
        await booking.save();

        res.status(201).json({ message: 'Review added successfully!' });

    } catch (error) {
        console.error('Error creating service review:', error.message, error.stack);
        res.status(500).json({ message: 'Server Error' });
    }
};

// export const createServiceReview = async (req, res) => {
//     const { rating, comment } = req.body;
//     const { bookingId } = req.params;

//     try {
//         // 1. Find the booking and populate the related customer and service data
//         const booking = await Booking.findById(bookingId).populate('customer').populate('service');

//         // --- VALIDATIONS ---
//         if (!booking) {
//             return res.status(404).json({ message: 'Booking not found.' });
//         }

//         // *** FIX STARTS HERE ***
//         // Add a check to ensure the populated service exists before trying to access its properties.
//         // If 'booking.service' is null, it means the service linked to this booking was not found.
//         if (!booking.service) {
//             return res.status(404).json({ message: 'The service for this booking was not found and cannot be reviewed.' });
//         }
//         // *** FIX ENDS HERE ***

//         // Ensure the person leaving the review is the one who made the booking
//         if (booking.customer._id.toString() !== req.user.id) {
//             return res.status(403).json({ message: 'You are not authorized to review this booking.' });
//         }
//         // A review can only be left for a completed service
//         if (booking.status !== 'Completed') {
//             return res.status(400).json({ message: 'You can only review completed services.' });
//         }
//         // Check if a review was already submitted for this booking
//         if (booking.reviewSubmitted) {
//             return res.status(400).json({ message: 'You have already submitted a review for this service.' });
//         }

//         // 2. We can now safely use the populated service object.
//         // The redundant findById call is no longer needed.
//         const service = booking.service;

//         // 3. Create the review object
//         const review = {
//             user: req.user.id,
//             username: booking.customer.fullName, // Get username from the populated customer
//             rating: Number(rating),
//             comment,
//         };

//         // 4. Add the review to the service's reviews array
//         service.reviews.push(review);

//         // 5. Update the service's overall rating stats
//         service.numReviews = service.reviews.length;
//         service.rating = service.reviews.reduce((acc, item) => item.rating + acc, 0) / service.reviews.length;
        
//         // 6. Mark the booking as having a review submitted
//         booking.reviewSubmitted = true;

//         // 7. Save both the updated service and booking to the database
//         await service.save();
//         await booking.save();
        
//         // 8. Send success response
//         res.status(201).json({ message: 'Review added successfully!' });

//     } catch (error) {
//         // This will now only catch unexpected errors, not the "null property" crash.
//         console.error('Error creating service review:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };