import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";
import { sendServiceRejectionEmail, sendVendorApprovalEmail, sendVendorReactivationEmail, sendVendorRejectionEmail, sendVendorSuspensionEmail } from "../utils/vendorProcessingEmail.js";



// Helper function to calculate overview statistics
const calculateOverviewStats = async () => {
    try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get total number of services
        const totalServices = await Service.countDocuments({});

        // Get services created this month
        const currentMonthServices = await Service.countDocuments({
            createdAt: { $gte: currentMonthStart }
        });

        // Get services created last month
        const lastMonthServices = await Service.countDocuments({
            createdAt: {
                $gte: lastMonthStart,
                $lte: lastMonthEnd
            }
        });

        // Calculate percentage change
        let percentageChange = 0;
        if (lastMonthServices > 0) {
            percentageChange = ((currentMonthServices - lastMonthServices) / lastMonthServices) * 100;
        } else if (currentMonthServices > 0) {
            percentageChange = 100; // No services last month, but services this month = 100% increase
        }

        return {
            totalServices,
            percentageChange: Math.round(percentageChange * 100) / 100, // Round to 2 decimal places
            currentMonthServices,
            lastMonthServices
        };
    } catch (error) {
        console.error('Error calculating overview stats:', error);
        throw new Error('Failed to calculate overview statistics');
    }
};


export const fetchAllVendors = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        const { q, status, approvedStatus } = req.query;

        // FILTERS
        const filter = {};

        if (status && ["active", "suspended"].includes(status)) {
            filter.status = status;
        }

        if (approvedStatus && ['pending', 'approved', 'rejected'].includes(approvedStatus)) {
            filter.approvedStatus = approvedStatus;
        }

        if (q) {
            filter.$or = [
                { email: { $regex: q, $options: "i" } },
                { businessName: { $regex: q, $options: "i" } }
            ];
        }

        // --- 1. Overview Stats ---

        // Define current and previous month date ranges
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month counts
        const totalClients = await Vendor.countDocuments();
        const activeClients = await Vendor.countDocuments({ status: "active" });
        const suspendedClients = await Vendor.countDocuments({ status: "suspended" });

        // Last month counts
        const lastMonthTotal = await Vendor.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthActive = await Vendor.countDocuments({
            status: "active",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthSuspended = await Vendor.countDocuments({
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

        const totalFiltered = await Vendor.countDocuments(filter);

        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const allVendors = await Vendor.find({
            ...filter,
            kycuploaded: true,
        }).select('-password -googleID')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
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
            data: allVendors
        });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


export const fetchAllDrivers = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { q, status, approvedStatus } = req.query;

        // --- FILTERS ---
        const filter = { VendorType: "driver" };

        if (status && ["active", "suspended"].includes(status)) {
            filter.status = status;
        }

        if (approvedStatus && ["pending", "approved", "rejected"].includes(approvedStatus)) {
            filter.approvedStatus = approvedStatus;
        }

        if (q) {
            filter.$or = [
                { email: { $regex: q, $options: "i" } },
                { vendorName: { $regex: q, $options: "i" } },
                { businessName: { $regex: q, $options: "i" } },
            ];
        }

        // --- Overview Stats ---
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month counts
        const totalDrivers = await Vendor.countDocuments({ VendorType: "driver" });
        const activeDrivers = await Vendor.countDocuments({ VendorType: "driver", status: "active" });
        const suspendedDrivers = await Vendor.countDocuments({ VendorType: "driver", status: "suspended" });

        // Last month counts
        const lastMonthTotal = await Vendor.countDocuments({
            VendorType: "driver",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthActive = await Vendor.countDocuments({
            VendorType: "driver",
            status: "active",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        const lastMonthSuspended = await Vendor.countDocuments({
            VendorType: "driver",
            status: "suspended",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        });

        // --- Helper for percentage change ---
        const getPercentageChange = (current, previous) => {
            if (previous === 0 && current === 0) return 0;
            if (previous === 0) return 100;
            return (((current - previous) / previous) * 100).toFixed(1);
        };

        const totalChange = getPercentageChange(totalDrivers, lastMonthTotal);
        const activeChange = getPercentageChange(activeDrivers, lastMonthActive);
        const suspendedChange = getPercentageChange(suspendedDrivers, lastMonthSuspended);

        // --- Pagination ---
        const totalFiltered = await Vendor.countDocuments(filter);
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const allDrivers = await Vendor.find({
            ...filter,
            kycuploaded: true,
        })
            .select("-password -googleID")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            overview: {
                totalDrivers,
                activeDrivers,
                suspendedDrivers,
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
            data: allDrivers,
        });
    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};



export const approveVendor = async (req, res) => {
    try {

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        const { vendorId } = req.body;
        // Try to find vendor in Vendor or Driver collections
        let vendor =
            (await Vendor.findById(vendorId).select("-password -googleID"));

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        // Approve vendor/driver
        vendor.approvedStatus = "approved";
        await vendor.save();

        await sendVendorApprovalEmail(vendor);
        res.status(200).json({ success: true, message: "Vendor approved" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const rejectVendor = async (req, res) => {
    try {
        const { vendorId, declineReason } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        if (!declineReason) {
            return res.status(404).json({
                success: false,
                message: "Must add reason for rejecting vendor"
            });
        }

        let vendor =
            (await Vendor.findById(vendorId).select("-password -googleID"))

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        vendor.approvedStatus = 'rejected';
        vendor.declineReason = declineReason;
        await vendor.save();

        await sendVendorRejectionEmail(vendor, declineReason);
        res.status(200).json({ success: true, message: "Vendor rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



export const suspendVendor = async (req, res) => {
    try {
        const { vendorId, suspendReason } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        let vendor =
            (await Vendor.findById(vendorId).select("-password -googleID"));

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        vendor.status = 'suspended';
        vendor.suspendReason = suspendReason;
        await vendor.save();

        await sendVendorSuspensionEmail(vendor, suspendReason);
        res.status(200).json({ success: true, message: "Vendor suspended" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const activateVendor = async (req, res) => {
    try {
        const { vendorId } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        let vendor =
            (await Vendor.findById(vendorId).select("-password -googleID"));
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        vendor.status = 'active';
        await vendor.save();

        await sendVendorReactivationEmail(vendor);
        res.status(200).json({ success: true, message: "Vendor activated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const fetchAllServices = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        // Extract query parameters for filtering
        const {
            approvedStatus,
            servicetype,
        } = req.query;

        // Build filter object
        const filter = {};

        // Filter by approvedStatus
        if (approvedStatus && ['pending', 'approved', 'rejected'].includes(approvedStatus)) {
            filter.approvedStatus = approvedStatus;
        }

        // Filter by servicetype
        if (servicetype && ['security', 'apartment', 'car rental', 'event', 'cruise'].includes(servicetype)) {
            filter.serviceType = servicetype;
        }

        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalService = await Service.countDocuments(filter);

        // Fetch services with applied filters
        const services = await Service.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Prepare response data
        const responseData = { data: services };

        const overviewStats = await calculateOverviewStats();
        responseData.overview = overviewStats;

        res.status(200).json({
            success: true,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalService / limit),
                perPage: limit,
            },
            responseData
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }

};


export const declineService = async (req, res) => {
    try {
        const { serviceId, declineReason } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        if (service.approvedStatus === 'rejected') {
            return res.status(400).json({ success: false, message: "Service is already rejected" });
        }

        if (service.approvedStatus === 'approved') {
            return res.status(400).json({ success: false, message: "Approved services cannot be declined" });
        }

        service.approvedStatus = 'rejected';
        service.declineReason = declineReason;
        await service.save();

        await sendServiceRejectionEmail(service.vendorEmail, service.vendorName, service.serviceName, service.serviceType, declineReason);

        res.status(200).json({
            success: true,
            message: "Service declined",
            data: service
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const approveService = async (req, res) => {
    try {
        const { serviceId } = req.body;
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        if (service.approvedStatus === 'rejected') {
            return res.status(400).json({ success: false, message: "Rejected services cannot be approved" });
        }

        if (service.approvedStatus === 'approved') {
            return res.status(400).json({ success: false, message: "Service already approved" });
        }

        service.approvedStatus = 'approved';
        await service.save();

        await sendVendorApprovalEmail(service.vendorEmail, service.vendorName, service.serviceName, service.serviceType);
        res.status(200).json({
            success: true,
            message: "Service approved",
            data: service
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};