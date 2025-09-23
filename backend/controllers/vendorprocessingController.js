import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";



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

        const allVendors = await Vendor.find({
            kycuploaded: true,
        }).select('_id businessName directorID cac address phone');
        res.status(200).json({ success: true, data: allVendors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
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
        const vendor = await Vendor.findById(vendorId).select('_id businessName directorID cac address phone');
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        vendor.approvedStatus = 'approved';
        await vendor.save();
        res.status(200).json({ success: true, message: "Vendor approved" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const rejectVendor = async (req, res) => {
    try {
        const { vendorId } = req.body;

        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        const vendor = await Vendor.findById(vendorId).select('_id businessName directorID cac address phone');
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        vendor.approvedStatus = 'rejected';
        await vendor.save();
        res.status(200).json({ success: true, message: "Vendor rejected" });
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
            startDate,
            endDate,
        } = req.query;

        // Build filter object
        const filter = {};

        // Filter by approvedStatus
        if (approvedStatus && ['pending', 'approved', 'rejected'].includes(approvedStatus)) {
            filter.approvedStatus = approvedStatus;
        }

        // Filter by servicetype
        if (servicetype && ['security', 'hospitality', 'car rental', 'driving', 'events', 'cruise'].includes(servicetype)) {
            filter.servicetype = servicetype;
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Fetch services with applied filters
        const services = await Service.find(filter).sort({ createdAt: -1 });

        // Prepare response data
        const responseData = { success: true, data: services };

        const overviewStats = await calculateOverviewStats();
        responseData.overview = overviewStats;

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const declineService = async (req, res) => {
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
            return res.status(400).json({ success: false, message: "Service is already rejected" });
        }

        if (service.approvedStatus === 'approved') {
            return res.status(400).json({ success: false, message: "Approved services cannot be declined" });
        }

        service.approvedStatus = 'rejected';
        await service.save();

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
        res.status(200).json({
            success: true,
            message: "Service approved",
            data: service
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};