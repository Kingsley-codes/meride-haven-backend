import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import crypto from "crypto";
import Token from "../models/tokenModel.js";
import { sendInvitationEmail } from "../utils/emailSender.js";
import bcrypt from "bcrypt";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';



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

        if (status && ["in progress", "cancelled", "upcoming", "pending", "failed", "completed"].includes(status)) {
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


        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalBookings = await Booking.countDocuments(filter);

        // FETCH BOOKINGS + VENDOR NAME
        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "vendor",
                select: "vendorName, bankDetails",
            })
            .skip(skip)
            .limit(limit)
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
                status: "upcoming",
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
                status: "upcoming",
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
            upcoming: {
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
            totalFiltered: totalBookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                perPage: limit,
            },
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
            .populate({
                path: "vendor",
                select: "businessName", // only fetch businessName
            })
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



export const getBookingAnalytics = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        // 1️⃣ BOOKING SUMMARY — Total bookings for each month (Jan–Dec)
        const bookingSummary = await Booking.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalBookings: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: "$_id",
                    totalBookings: 1,
                    _id: 0
                }
            },
            { $sort: { month: 1 } } // chronological order
        ]);

        // 2️⃣ REVENUE TREND — Total revenue from completed bookings, per month, per service type
        const revenueTrend = await Booking.aggregate([
            {
                $match: { status: "completed" }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        serviceType: "$serviceType"
                    },
                    totalRevenue: { $sum: "$price" }
                }
            },
            {
                $project: {
                    month: "$_id.month",
                    serviceType: "$_id.serviceType",
                    totalRevenue: 1,
                    _id: 0
                }
            },
            { $sort: { month: 1 } }
        ]);

        // 3️⃣ TOP 5 MOST REQUESTED SERVICES
        const topServices = await Booking.aggregate([
            {
                $group: {
                    _id: "$service",
                    totalBookings: { $sum: 1 }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "services", // must match the actual collection name
                    localField: "_id",
                    foreignField: "_id",
                    as: "serviceInfo"
                }
            },
            { $unwind: "$serviceInfo" },
            {
                $project: {
                    _id: 0,
                    serviceName: "$serviceInfo.serviceName",
                    serviceType: "$serviceInfo.serviceType",
                    price: "$serviceInfo.price",
                    totalBookings: 1
                }
            }
        ]);

        // ✅ Return combined analytics
        res.status(200).json({
            success: true,
            message: "Booking analytics retrieved successfully",
            data: {
                bookingSummary,
                revenueTrend,
                topServices
            }
        });

    } catch (error) {
        console.error("Error fetching booking analytics:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching booking analytics",
            error: error.message
        });
    }
};


// inviteController.js
export const inviteAdmin = async (req, res) => {

    const admin = req.admin;
    if (!admin) {
        return res.status(403).json({
            success: false,
            message: "You are Unauthorized",
        });
    }

    const adminDetails = await Admin.findById(admin)

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { fullName, email, phone, role } = req.body;
        const inviterName = adminDetails.fullName;
        const inviterRole = adminDetails.role

        // Define role hierarchy (higher index = higher privilege)
        const roleHierarchy = {
            'support staff': 0,
            'super-admin': 1
        };


        // Validate required fields
        if (!fullName || !email || !role || !phone) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Full name, email, nin, phone number and role are required"
            });
        }

        // --- NEW: Email format validation ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }


        // --- NEW: Clean and validate the role ---
        let cleanRole = role;
        // Handle case where role comes as a stringified array like "[admin]"
        if (typeof role === 'string' && role.startsWith('[') && role.endsWith(']')) {
            try {
                // Attempt to parse the string into an array and take the first element
                const parsedArray = JSON.parse(role);
                cleanRole = parsedArray[0]; // Get the first item from the array
            } catch (parseError) {
                // If parsing fails, clean the string by removing brackets
                cleanRole = role.replace(/[\[\]"]/g, '');
            }
        }

        // Final check if the role is valid/non-empty
        if (!cleanRole) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "A valid role is required"
            });
        }

        // --- NEW: Authorization Check ---
        // Check if inviter is allowed to assign this role
        const inviterRoleLevel = roleHierarchy[inviterRole];
        const targetRoleLevel = roleHierarchy[cleanRole];

        if (inviterRoleLevel === undefined || targetRoleLevel === undefined) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        if (targetRoleLevel > inviterRoleLevel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: `You cannot assign a role higher than your current role (${inviterRole})`
            });
        }

        // Check if user already exists
        const existingUser = await Admin.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create new user with temporary password
        const newAdmin = new Admin({
            fullName,
            email,
            phone,
            status: "invited",
            role,
            isVerified: false // Will be set to true after password setup
        });

        await newAdmin.save({ session });

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const invitationToken = new Token({
            adminId: newAdmin._id,
            token
        });

        await invitationToken.save({ session });

        // Send invitation email
        await sendInvitationEmail(email, token, inviterName, false);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            data: {
                adminId: newAdmin._id,
                email: newAdmin.email
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error inviting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send invitation",
            error: error.message
        });
    }
};



export const setPassword = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Token and password are required"
            });
        }

        // Validate token
        const tokenDoc = await Token.findOne({ token }).session(session);
        if (!tokenDoc) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        // Update user password and set as verified
        const admin = await Admin.findById(tokenDoc.adminId).session(session);
        if (!admin) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Admin not found"
            });
        }

        admin.password = await bcrypt.hash(password, 12);
        admin.isVerified = true;
        admin.status = "active";
        await admin.save({ session });

        // Delete used token
        await Token.deleteOne({ _id: tokenDoc._id }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Password set successfully. You can now login."
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error setting password:", error);
        res.status(500).json({
            success: false,
            message: "Failed to set password",
            error: error.message
        });
    }
};



// controllers/inviteController.js (add this function)
export const resendInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const admin = req.admin;
    if (!admin) {
        return res.status(403).json({
            success: false,
            message: "You are Unauthorized",
        });
    }

    try {
        const { adminId } = req.body;
        const adminDetails = await Admin.findById(admin)
        const inviterName = adminDetails.fullName;


        // Validate user exists and is not verified
        const admin = await Admin.findById(adminId).session(session);
        if (!admin) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (admin.isVerified) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Admin has already completed registration"
            });
        }

        // Remove any existing invitation tokens for this user
        await Token.deleteMany({
            adminId: admin._id,
            type: "invitation"
        }).session(session);

        // Generate new invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const invitationToken = new Token({
            adminId: admin._id,
            token,
            type: "invitation"
        });

        await invitationToken.save({ session });

        // Send invitation email
        await sendInvitationEmail(admin.email, token, inviterName);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Invitation resent successfully",
            data: {
                adminId: admin._id,
                email: admin.email,
                expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error resending invitation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to resend invitation",
            error: error.message
        });
    }
};


export const editUserRole = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { adminId, newRole } = req.body;

        const inviterId = req.admin;
        if (!inviterId) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const adminDetails = await Admin.findById(inviterId)
        const inviterName = adminDetails.fullName;
        const inviterRole = adminDetails.role;

        // Define role hierarchy (higher index = higher privilege)
        const roleHierarchy = {
            'support staff': 0,
            'super-admin': 1
        };

        // Validate required fields
        if (!adminId || !newRole) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Admin ID and new role are required"
            });
        }

        // Check if new role is valid
        if (!roleHierarchy.hasOwnProperty(newRole)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Invalid role specified. Valid roles: support staff, super-admin"
            });
        }

        // Check if user is trying to edit themselves
        if (adminId === inviterId.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "You cannot edit your own role"
            });
        }

        // Check if inviter is allowed to assign this role
        const inviterRoleLevel = roleHierarchy[inviterRole];
        const targetRoleLevel = roleHierarchy[newRole];

        if (targetRoleLevel > inviterRoleLevel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: `You cannot assign a role higher than your current role (${inviterRole})`
            });
        }

        // Find the target user
        const targetUser = await Admin.findById(adminId).session(session);
        if (!targetUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Prevent editing roles of users with equal or higher roles
        const currentTargetRoleLevel = roleHierarchy[targetUser.role];
        if (currentTargetRoleLevel >= inviterRoleLevel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: `You cannot edit the role of a user with ${targetUser.role} role or higher`
            });
        }

        // Update the user's role
        targetUser.role = newRole;
        targetUser.updatedAt = new Date();
        await targetUser.save({ session });

        // Log the role change (optional - you might want to create an audit log)
        console.log(`Admin ${inviterName} changed role of user ${adminId} from ${targetUser.role} to ${newRole}`);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: {
                adminId: targetUser._id,
                email: targetUser.email,
                newRole: newRole,
                updatedAt: targetUser.updatedAt
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error editing user role:", error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update user role",
            error: error.message
        });
    }
};


export const fetchAllAdmins = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const admins = await Admin.find().select("-password -googleID");

        res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            admins
        });

    } catch (error) {
        console.error("Error editing user role:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admins",
            error: error.message
        });
    }
}


export const editProfile = async (req, res) => {
    try {

        const { phoneNumber } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits",
            });
        }

        let profile = await Admin.findById(admin);

        if (phoneNumber !== undefined) {
            profile.phone = phoneNumber;
        }

        // Handle profilePhoto upload if a file is provided
        if (req.file) {

            try {
                // Delete old profilePhoto from Cloudinary if it exists
                if (profile.profilePhoto && profile.profilePhoto.publicId) {
                    await cloudinary.uploader.destroy(profile.profilePhoto.publicId);
                }

                // Upload new profilePhoto to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "Meride Haven/profilePhoto",
                    width: 500,
                    height: 500,
                    crop: "fill"
                });

                // Update profilePhoto in profile
                profile.profilePhoto = {
                    publicId: result.public_id,
                    url: result.secure_url
                };
                // Delete the temporary file after successful upload
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (uploadErr) {

                // Clean up the file if upload fails
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    success: false,
                    message: `Failed to upload image: ${uploadErr.message}`
                });
            }
        };

        // Save the updated profile
        const updatedProfile = await profile.save();

        res.status(200).json({
            success: true,
            message: "Organization profile updated successfully",
            data: {
                fullName: updatedProfile.fullName,
                profilePhoto: updatedProfile.profilePhoto,
                phoneNumber: updatedProfile.phone,
            }
        });
    } catch (error) {
        console.error("Error updating organization profile:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }


        res.status(500).json({
            success: false,
            message: "Server error while updating user profile",
            error: error.message,
        });
    }
};


export const getUserProfile = async (req, res) => {
    try {
        const admin = req.admin
        const profile = await Admin.findById(admin).select("-password -googleID");


        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};