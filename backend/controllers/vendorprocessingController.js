import Vendor from "../models/vendorModel.js";

export const fetchPendingVendors = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized"
            });
        }

        const pendingVendors = await Vendor.find({
            kycuploaded: true,
            approvedStatus: 'pending'
        }).select('_id businessName directorID cac address');
        res.status(200).json({ success: true, data: pendingVendors });
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
        const vendor = await Vendor.findById(vendorId).select('_id businessName directorID cac address');
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

        const vendor = await Vendor.findById(vendorId).select('_id businessName directorID cac address');
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