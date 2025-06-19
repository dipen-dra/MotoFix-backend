const Booking = require("../../models/Booking");

// Get all bookings (FIXED)
exports.getBookings = async (req, res) => {
    try {
        // THE FIX: Changed .populate('user', ...) to .populate('customer', ...)
        // to match the field name in your Booking.js model.
        const bookings = await Booking.find().populate('customer', 'fullName email');
        
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Admin getBookings Error:", error); // Better server-side logging
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Update a booking (IMPROVED)
exports.updateBooking = async (req, res) => {
    try {
        // Find the booking first to ensure it exists
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        // Update the fields from the request body
        Object.assign(booking, req.body);
        
        // Save the changes and then populate the customer details before sending back
        const updatedBooking = await booking.save();
        await updatedBooking.populate('customer', 'fullName email');
        
        res.status(200).json({ success: true, message: "Booking updated successfully.", data: updatedBooking });
    } catch (error) {
        console.error("Admin updateBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Delete a booking (No changes needed, this is fine)
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        res.status(200).json({ success: true, message: "Booking deleted successfully." });
    } catch (error) {
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};