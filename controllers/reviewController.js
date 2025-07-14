/**
 * @file controllers/reviewController.js
 * @description Controller for creating and managing reviews.
 */

const Booking = require('../models/Booking');
const Service = require('../models/Service');
// The 'User' import is not strictly necessary here, but we can leave it.
const User = require('../models/User');

/**
 * @route   POST /api/reviews/:bookingId
 * @desc    Create a new review for a service via a completed booking
 * @access  Private (User)
 */
const createServiceReview = async (req, res) => {
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

module.exports = {
    createServiceReview,
};