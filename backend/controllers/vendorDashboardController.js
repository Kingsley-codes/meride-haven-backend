import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";

export const fetchAllBookings = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { status, servicetype, q, startDate, endDate } = req.query;

        // Base filter (no vendor yet)
        const filter = {};

        if (status && ["in progress", "cancelled", "confirmed", "pending", "failed", "completed"].includes(status)) {
            filter.status = status;
        }

        if (servicetype && ["security", "apartment", "car rental", "event", "cruise"].includes(servicetype)) {
            filter.serviceType = servicetype;
        }

        if (q) {
            filter.$or = [
                { clientNumber: { $regex: q, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const bookings = await Booking.find({
            ...filter,
            vendor: vendor,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            bookings,
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



export const acceptBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
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

        // Find and update the booking in one go
        const booking = await Booking.findOneAndUpdate(
            { bookingID, vendor: vendor, status: { $ne: "in progress" } },
            { status: "in progress" },
            { new: true } // returns the updated document
        );

        // If not found or already accepted
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or already accepted",
            });
        }

        const client = await User.findOne({ phone: booking.clientNumber });

        if (!client) {
            console.log("User not found for: ", booking.clientNumber);
            throw new Error("User not found");
        }

        client.booking += 1;
        client.lastBooking = new Date();
        await client.save();

        return res.status(200).json({
            success: true,
            message: "Booking accepted successfully",
            booking,
        });
    } catch (error) {
        console.error("Error accepting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while accepting the booking",
            error: error.message,
        });
    }
};


export const rejectBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
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
        const existingBooking = await Booking.findOne({ bookingID, vendor: vendor });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if booking is already in progress or cancelled
        if (existingBooking.status === "in progress") {
            return res.status(400).json({
                success: false,
                message: "Cannot reject booking that is already in progress",
            });
        }

        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "cancelled";

        await existingBooking.save();

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: updatedBooking,
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


export const cancelBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
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
        const existingBooking = await Booking.findOne({ bookingID, vendor: vendor });

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
