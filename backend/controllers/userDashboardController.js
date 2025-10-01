import Booking from "../models/bookingModel.js";


export const getUserActiveBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const activeBookings = await Booking.find({ user: userId, status: "in progress" });
        res.status(200).json(activeBookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching active bookings", error });
    }
};

export const getUserCompletedBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const completedBookings = await Booking.find({ user: userId, status: "completed" });
        res.status(200).json(completedBookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching completed bookings", error });
    }
};

export const getUserCancelledBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const cancelledBookings = await Booking.find({ user: userId, status: "cancelled" });
        res.status(200).json(cancelledBookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching cancelled bookings", error });
    }
};


