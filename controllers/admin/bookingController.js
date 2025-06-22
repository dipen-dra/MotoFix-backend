// const Booking = require("../../models/Booking");

// // Get all bookings
// exports.getBookings = async (req, res) => {
//     try {
//         // FINAL FIX: Removed .populate('serviceType')
//         const bookings = await Booking.find({})
//             .populate('customer', 'fullName email');
        
//         res.status(200).json({ success: true, data: bookings });
//     } catch (error) {
//         console.error("Admin getBookings Error:", error);
//         res.status(500).json({ success: false, message: "Server error.", error: error.message });
//     }
// };

// // Get single booking by ID
// exports.getBooking = async (req, res) => {
//     try {
//         // FINAL FIX: Removed .populate('serviceType')
//         const booking = await Booking.findById(req.params.id)
//             .populate('customer', 'fullName email phone');

//         if (!booking) {
//             return res.status(404).json({ success: false, message: "Booking not found" });
//         }

//         res.status(200).json({ success: true, data: booking });
//     } catch (error) {
//         console.error("Admin getBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error.", error: error.message });
//     }
// };


// // Update a booking
// exports.updateBooking = async (req, res) => {
//     try {
//         const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

//         if (!updatedBooking) {
//             return res.status(404).json({ success: false, message: "Booking not found." });
//         }

//         // Populate the customer info of the updated document before sending it back
//         await updatedBooking.populate('customer', 'fullName email');

//         res.status(200).json({ success: true, message: "Booking updated successfully.", data: updatedBooking });
//     } catch (error) {
//         console.error("Admin updateBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error.", error: error.message });
//     }
// };

// // Delete a booking
// exports.deleteBooking = async (req, res) => {
//     try {
//         const booking = await Booking.findByIdAndDelete(req.params.id);
//         if (!booking) {
//             return res.status(404).json({ success: false, message: "Booking not found." });
//         }
//         res.status(200).json({ success: true, message: "Booking deleted successfully." });
//     } catch (error) {
//         console.error("Admin deleteBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error.", error: error.message });
//     }
// };


// const Booking = require('../../models/Booking');

// /**
//  * @desc    Get all bookings
//  * @route   GET /api/admin/bookings
//  * @access  Private/Admin
//  */
// const getAllBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.find({})
//             .populate('customer', 'fullName email phone') // Ensure phone is populated here
//             // .populate('service', 'name');
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
//         // This is the critical change: add 'phone' to the populate fields
//         const booking = await Booking.findById(req.params.id)
//             .populate('customer', 'fullName email phone') // <-- CRITICAL CHANGE
//             // .populate('service', 'name');

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
//  * @desc    Update booking status
//  * @route   PUT /api/admin/bookings/:id/status
//  * @access  Private/Admin
//  */
// const updateBookingStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({ success: false, message: 'Booking not found' });
//         }

//         booking.status = status;
//         await booking.save();

//         res.json({ success: true, data: booking });
//     } catch (error) {
//         console.error('Error updating booking status:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
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
//     } catch (error) {
//         console.error("Admin deleteBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error." });
//     }
// };


// module.exports = {
//     getAllBookings,
//     getBookingById,
//     updateBookingStatus,
//     deleteBooking,
// };

// const Booking = require('../../models/Booking');

// /**
//  * @desc    Get all bookings
//  * @route   GET /api/admin/bookings
//  * @access  Private/Admin
//  */
// const getAllBookings = async (req, res) => {
//     try {
//         // Ensure 'phone' is included in the populated customer data
//         const bookings = await Booking.find({})
//             .populate('customer', 'fullName email phone') 
//             console.log("Data being sent to frontend")
//             .sort({ createdAt: -1 }); // Optional: sort by most recent
            
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
//         // Ensure 'phone' is included in the populated customer data
//         const booking = await Booking.findById(req.params.id)
//             .populate('customer', 'fullName email phone'); // <-- IMPORTANT CHANGE

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
//  * @desc    Update booking status
//  * @route   PUT /api/admin/bookings/:id/status
//  * @access  Private/Admin
//  */
// const updateBookingStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         // Validate status if needed
//         const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ success: false, message: 'Invalid status value' });
//         }

//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({ success: false, message: 'Booking not found' });
//         }

//         booking.status = status;
//         await booking.save();

//         // Populate customer data in the response so the UI can update if needed
//         const updatedBooking = await Booking.findById(booking._id)
//             .populate('customer', 'fullName email phone');

//         res.json({ success: true, data: updatedBooking });
//     } catch (error) {
//         console.error('Error updating booking status:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
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
//     } catch (error) {
//         console.error("Admin deleteBooking Error:", error);
//         res.status(500).json({ success: false, message: "Server error." });
//     }
// };


// module.exports = {
//     getAllBookings,
//     getBookingById,
//     updateBookingStatus,
//     deleteBooking,
// };

const Booking = require('../../models/Booking');

/**
 * @desc    Get all bookings
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('customer', 'fullName email phone') 
            .sort({ createdAt: -1 });
            
        // LOGGING ADDED HERE:
        // console.log("DATA FOR ALL BOOKINGS LIST:", bookings);

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error("Admin getBookings Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


/**
 * @desc    Get a single booking by ID
 * @route   GET /api/admin/bookings/:id
 * @access  Private/Admin
 */
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'fullName email phone');

        // LOGGING ADDED HERE:
        // console.log("DATA FOR SINGLE BOOKING:", booking);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error(`Error fetching booking by ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Private/Admin
 */
// ... other functions in adminController.js

/**
 * @desc    Update a booking (status, cost, etc.)
 * @route   PUT /api/admin/bookings/:id
 * @access  Private/Admin
 */
const updateBooking = async (req, res) => { // Renamed for clarity
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
        
        // Populate the response to keep the frontend data consistent
        await updatedBooking.populate('customer', 'fullName email phone');

        res.json({ success: true, data: updatedBooking, message: "Booking updated successfully." });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

// const updateBookingStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ success: false, message: 'Invalid status value' });
//         }

//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({ success: false, message: 'Booking not found' });
//         }

//         booking.status = status;
//         await booking.save();

//         const updatedBooking = await Booking.findById(booking._id)
//             .populate('customer', 'fullName email phone');

//         res.json({ success: true, data: updatedBooking });
//     } catch (error) {
//         console.error('Error updating booking status:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


/**
 * @desc    Delete a booking
 * @route   DELETE /api/admin/bookings/:id
 * @access  Private/Admin
 */
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