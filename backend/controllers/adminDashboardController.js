import Booking from "../models/bookingModel.js";


export const fetchAllBookings = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { q, status, paymentStatus, startDate, endDate } = req.query;

        // FILTERS
        const filter = {};

        if (paymentStatus && ["pending", "failed", "completed", "refunded"].includes(paymentStatus)) {
            filter.paymentStatus = paymentStatus;
        }

        if (status && ["in progress", "cancelled", "confirmed", "pending", "failed", "completed"].includes(status)) {
            filter.status = status;
        }

        if (q) {
            filter.$or = [
                { bookingID: { $regex: q, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // FETCH BOOKINGS + VENDOR NAME
        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "vendor",
                select: "vendorName",
            })
            .lean();

        // 🔹 OVERVIEW STATS (Month-to-Month)
        const now = new Date();

        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month stats
        const [
            totalCurrent,
            cancelledCurrent,
            completedCurrent,
            confirmedCurrent,
            inProgressCurrent,
            pendingCurrent,
        ] = await Promise.all([
            Booking.countDocuments({
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
            Booking.countDocuments({
                status: "cancelled",
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
            Booking.countDocuments({
                status: "completed",
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
            Booking.countDocuments({
                status: "confirmed",
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
            Booking.countDocuments({
                status: "in progress",
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
            Booking.countDocuments({
                status: "pending",
                createdAt: { $gte: currentMonthStart, $lt: nextMonthStart },
            }),
        ]);

        // Last month stats
        const [
            totalLast,
            cancelledLast,
            completedLast,
            confirmedLast,
            inProgressLast,
            pendingLast,
        ] = await Promise.all([
            Booking.countDocuments({
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            Booking.countDocuments({
                status: "cancelled",
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            Booking.countDocuments({
                status: "completed",
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            Booking.countDocuments({
                status: "confirmed",
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            Booking.countDocuments({
                status: "in progress",
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            Booking.countDocuments({
                status: "pending",
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
        ]);

        // PERCENTAGE CHANGE HELPER
        const percentChange = (current, last) => {
            if (last === 0) return current === 0 ? 0 : 100;
            return (((current - last) / last) * 100).toFixed(2);
        };

        const overview = {
            total: {
                count: totalCurrent,
                change: percentChange(totalCurrent, totalLast),
            },
            cancelled: {
                count: cancelledCurrent,
                change: percentChange(cancelledCurrent, cancelledLast),
            },
            completed: {
                count: completedCurrent,
                change: percentChange(completedCurrent, completedLast),
            },
            confirmed: {
                count: confirmedCurrent,
                change: percentChange(confirmedCurrent, confirmedLast),
            },
            inProgress: {
                count: inProgressCurrent,
                change: percentChange(inProgressCurrent, inProgressLast),
            },
            pending: {
                count: pendingCurrent,
                change: percentChange(pendingCurrent, pendingLast),
            },
        };

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            overview,
            totalFiltered: bookings.length,
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
