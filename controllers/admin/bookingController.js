const Booking = require("../../models/Booking");

// Get all bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'fullName email');
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Update a booking
exports.updateBooking = async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        res.status(200).json({ success: true, message: "Booking updated successfully.", data: updatedBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        res.status(200).json({ success: true, message: "Booking deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};