// const Booking = require('../../models/Booking');

// /**
//  * @desc    Get all bookings
//  * @route   GET /api/admin/bookings
//  * @access  Private/Admin
//  */
// const getAllBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.find({})
//             // UPDATED: Added 'address' to the populated fields
//             .populate('customer', 'fullName email phone address') 
//             .sort({ createdAt: -1 });
            
//         res.json({ success: true, data: bookings });
//     } catch (error) {
//         console.error("Admin getBookings Error:", error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };


// /**
//  * @desc    Get a single booking by ID
//  * @route   GET /api/admin/bookings/:id
//  * @access  Private/Admin
//  */
// const getBookingById = async (req, res) => {
//     try {
//         const booking = await Booking.findById(req.params.id)
//             // UPDATED: Added 'address' to the populated fields
//             .populate('customer', 'fullName email phone address');

//         if (!booking) {
//             return res.status(404).json({ success: false, message: 'Booking not found' });
//         }

//         res.json({ success: true, data: booking });
//     } catch (error) {
//         console.error(`Error fetching booking by ID: ${error.message}`);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// /**
//  * @desc    Update a booking (status, cost, etc.)
//  * @route   PUT /api/admin/bookings/:id
//  * @access  Private/Admin
//  */
// const updateBooking = async (req, res) => {
//     try {
//         const { status, totalCost } = req.body;
//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({ success: false, message: 'Booking not found' });
//         }

//         // Update fields if they are provided in the request
//         if (status) {
//             const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
//             if (!validStatuses.includes(status)) {
//                 return res.status(400).json({ success: false, message: 'Invalid status value' });
//             }
//             booking.status = status;
//         }
        
//         if (totalCost !== undefined) {
//             booking.totalCost = totalCost;
//         }

//         const updatedBooking = await booking.save();
        
//         // UPDATED: Added 'address' to the populated fields for the response
//         await updatedBooking.populate('customer', 'fullName email phone address');

//         res.json({ success: true, data: updatedBooking, message: "Booking updated successfully." });
//     } catch (error) {
//         console.error('Error updating booking:', error);
//         res.status(500).json({ success: false, message: 'Server error while updating booking.' });
//     }
// };

// /**
//  * @desc    Delete a booking
//  * @route   DELETE /api/admin/bookings/:id
//  * @access  Private/Admin
//  */
// const deleteBooking = async (req, res) => {
//     try {
//         const booking = await Booking.findByIdAndDelete(req.params.id);
//         if (!booking) {
//             return res.status(404).json({ success: false, message: "Booking not found." });
//         }
//         res.status(200).json({ success: true, message: "Booking deleted successfully." });
//     } catch (error)
//     {
//         console.error("Admin deleteBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error." });
//     }
// };

// module.exports = {
//     getAllBookings,
//     getBookingById,
//     updateBooking,
//     deleteBooking,
// };


const Booking = require('../../models/Booking');

/**
 * @desc    Get all paid bookings
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res) => {
    try {
        // Only fetch bookings that are paid
        const bookings = await Booking.find({ isPaid: true })
            .populate('customer', 'fullName email phone address')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error("Admin getBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ... (getBookingById, updateBooking, and deleteBooking remain the same)
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'fullName email phone address');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error(`Error fetching booking by ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateBooking = async (req, res) => {
    try {
        const { status, totalCost } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Update fields if they are provided in the request
        if (status) {
            const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status value' });
            }
            booking.status = status;
        }
        
        if (totalCost !== undefined) {
            booking.totalCost = totalCost;
        }

        const updatedBooking = await booking.save();
        
        await updatedBooking.populate('customer', 'fullName email phone address');

        res.json({ success: true, data: updatedBooking, message: "Booking updated successfully." });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        res.status(200).json({ success: true, message: "Booking deleted successfully." });
    } catch (error)
    {
        console.error("Admin deleteBooking Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};


module.exports = {
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
};