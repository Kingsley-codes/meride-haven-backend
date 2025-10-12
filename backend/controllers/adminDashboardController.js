import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";


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



export const fetchAllClients = async (req, res) => {
    try {

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { q, status } = req.query;

        // FILTERS
        const filter = {};

        if (status && ["active", "suspended"].includes(status)) {
            filter.status = status;
        }

        if (q) {
            filter.$or = [
                { phone: { $regex: q, $options: "i" } },
                { fullName: { $regex: q, $options: "i" } }
            ];
        }


        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // --- 1. Overview Stats ---

        // Define current and previous month date ranges
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month counts
        const totalClients = await User.countDocuments();
        const activeClients = await User.countDocuments({ status: "active" });
        const suspendedClients = await User.countDocuments({ status: "suspended" });

        // Last month counts
        const lastMonthTotal = await User.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthActive = await User.countDocuments({
            status: "active",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthSuspended = await User.countDocuments({
            status: "suspended",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        // Helper function for percentage change
        const getPercentageChange = (current, previous) => {
            if (previous === 0 && current === 0) return 0;
            if (previous === 0) return 100; // means growth from nothing
            return (((current - previous) / previous) * 100).toFixed(1);
        };

        // Month-to-month changes
        const totalChange = getPercentageChange(totalClients, lastMonthTotal);
        const activeChange = getPercentageChange(activeClients, lastMonthActive);
        const suspendedChange = getPercentageChange(
            suspendedClients,
            lastMonthSuspended
        );

        const totalFiltered = await User.countDocuments(filter);

        // --- 2. Paginated Client Data ---
        const clients = await User.find({
            ...filter
        })
            .select("_id bookings lastBooking profilePhoto phone status fullName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // --- 3. Response ---
        return res.status(200).json({
            success: true,
            overview: {
                totalClients,
                activeClients,
                suspendedClients,
                changes: {
                    totalChange: `${totalChange}%`,
                    activeChange: `${activeChange}%`,
                    suspendedChange: `${suspendedChange}%`,
                },
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalFiltered / limit),
                perPage: limit,
            },
            clients,
        });
    } catch (error) {
        console.error("Error fetching clients:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching clients",
            error: error.message,
        });
    }
};



export const fetchSingleClient = async (req, res) => {
    try {

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { clientID } = req.params

        if (!clientID) {
            return res.status(400).json({
                success: false,
                message: "Client ID required"
            })
        }

        const client = await User.findById(clientID)
            .select("_id bookings email profilePhoto phone address status fullName")

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const totalBookings = await Booking.countDocuments({ clientEmail: client.email });

        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const bookings = await Booking.find({ clientEmail: client.email })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            client,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                perPage: limit,
            },
            bookings
        })
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching bookings",
            error: error.message,
        });
    }
}


export const suspendClient = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { clientID } = req.body

        if (!clientID) {
            return res.status(400).json({
                success: false,
                message: "Client ID required"
            })
        }

        const client = await User.findById(clientID);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        client.status = "suspended";
        await client.save();

        res.status(200).json({
            success: true,
            message: "Client suspended"
        });

    } catch (error) {
        console.error("Error suspending client:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while suspending client",
            error: error.message,
        });
    }
}


export const activateClient = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { clientID } = req.body

        if (!clientID) {
            return res.status(400).json({
                success: false,
                message: "Client ID required"
            })
        }

        const client = await User.findById(clientID);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        client.status = "active";
        await client.save();

        res.status(200).json({
            success: true,
            message: "Client activated"
        });

    } catch (error) {
        console.error("Error suspending client:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while suspending client",
            error: error.message,
        });
    }
}
