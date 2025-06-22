const Booking = require("../../models/Booking");

// Get all bookings
exports.getBookings = async (req, res) => {
    try {
        // FINAL FIX: Removed .populate('serviceType')
        const bookings = await Booking.find({})
            .populate('customer', 'fullName email');
        
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Admin getBookings Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// Get single booking by ID
exports.getBooking = async (req, res) => {
    try {
        // FINAL FIX: Removed .populate('serviceType')
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'fullName email phoneNumber');

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.error("Admin getBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};


// Update a booking
exports.updateBooking = async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        // Populate the customer info of the updated document before sending it back
        await updatedBooking.populate('customer', 'fullName email');

        res.status(200).json({ success: true, message: "Booking updated successfully.", data: updatedBooking });
    } catch (error) {
        console.error("Admin updateBooking Error:", error);
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
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};