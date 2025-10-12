import Booking from "../models/bookingModel.js";
import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";



// export const getUserActiveBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const activeBookings = await Booking.find({ user: userId, status: "in progress" });
//         res.status(200).json(activeBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching active bookings", error });
//     }
// };

// export const getUserCompletedBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const completedBookings = await Booking.find({ user: userId, status: "completed" });
//         res.status(200).json(completedBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching completed bookings", error });
//     }
// };

// export const getUserCancelledBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const cancelledBookings = await Booking.find({ user: userId, status: "cancelled" });
//         res.status(200).json(cancelledBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching cancelled bookings", error });
//     }
// };

// export const getUserConfirmedBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const cancelledBookings = await Booking.find({ user: userId, status: "future" });
//         res.status(200).json(cancelledBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching future bookings", error });
//     }
// };


export const fetchAllBookings = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { status } = req.query;

        // Base filter 
        const filter = {};

        if (status && ["in progress", "cancelled", "confirmed", "completed"].includes(status)) {
            filter.status = status;
        }


        const bookings = await Booking.find({
            ...filter,
            client: user,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            bookings,
            totalFiltered: bookings.length
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching bookings",
            error: error.message,
        });
    }
};


export const cancelBooking = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find the booking first to check its current status
        const existingBooking = await Booking.findOne({ bookingID, client: user });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }


        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        if (existingBooking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "You cannot cancel a completed booking",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "cancelled";

        await existingBooking.save();

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: existingBooking,
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while rejecting the booking",
            error: error.message,
        });
    }
};


export const completeBooking = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find the booking first to check its current status
        const existingBooking = await Booking.findOne({ bookingID, client: user });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }


        if (existingBooking.status !== "in progress") {
            return res.status(400).json({
                success: false,
                message: "You can only complete a service that's in progress",
            });
        }

        if (existingBooking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Booking is already completed",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "completed";

        await existingBooking.save();

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: existingBooking,
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while rejecting the booking",
            error: error.message,
        });
    }
};



export const bookingRatingController = async (req, res) => {
    try {
        const { rating, reviewDescription, bookingID } = req.body;

        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (!bookingID) {
            return res.status(404).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a number between 1 and 5",
            });
        }

        // Find the booking
        const booking = await Booking.findOne({
            bookingID: bookingID,
            client: user
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.rating) {
            return res.status(404).json({
                success: false,
                message: "You already rated this booking",
            });
        }

        if (booking.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can only rate a completed booking",
            });
        }

        // Save rating and review on the booking
        booking.rating = rating;
        booking.reviewDescription = reviewDescription;
        await booking.save();

        const serviceId = booking.service;
        const vendorId = booking.vendor;

        // Calculate new average rating for the service
        const serviceBookings = await Booking.find({
            service: serviceId,
            rating: { $exists: true },
        });

        const serviceAverage =
            serviceBookings.reduce((acc, b) => acc + b.rating, 0) /
            serviceBookings.length;

        await Service.findByIdAndUpdate(serviceId, {
            rating: serviceAverage.toFixed(1),
        });

        // Calculate vendor average rating (based on all their bookings)
        const vendorBookings = await Booking.find({
            vendor: vendorId,
            rating: { $exists: true },
        });

        const vendorAverage =
            vendorBookings.reduce((acc, b) => acc + b.rating, 0) /
            vendorBookings.length;

        await Vendor.findByIdAndUpdate(vendorId, {
            rating: vendorAverage.toFixed(1),
        });

        return res.status(200).json({
            success: true,
            message: "Rating and review saved successfully",
            data: {
                booking,
                serviceRating: serviceAverage.toFixed(1),
                vendorRating: vendorAverage.toFixed(1),
            },
        });
    } catch (error) {
        console.error("Error in bookingRatingController:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};
