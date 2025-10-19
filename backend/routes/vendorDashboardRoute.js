import express from "express";
import {
    acceptBooking,
    addBankDetails,
    cancelBooking,
    completeBooking,
    editDriverProfile,
    editProfile,
    fetchAllBookings,
    fetchReviews,
    fetchVendorDashoboard,
    getUserProfile,
    getVendorEarnings,
    rejectBooking,
    updatecarDetails
} from "../controllers/vendorDashboardController.js";
import { vendorAuthenticate } from "../middleware/authenticationMiddleware.js";
import { upload, uploadServiceImages } from '../middleware/uploadMiddleware.js';



const vendorDashboardRouter = express.Router();


vendorDashboardRouter.get("/", vendorAuthenticate, fetchVendorDashoboard);
vendorDashboardRouter.get("/bookings", vendorAuthenticate, fetchAllBookings);
vendorDashboardRouter.get("/reviews", vendorAuthenticate, fetchReviews);
vendorDashboardRouter.get("/earnings", vendorAuthenticate, getVendorEarnings);
vendorDashboardRouter.post("/bookings/reject", vendorAuthenticate, rejectBooking);
vendorDashboardRouter.post("/bookings/accept", vendorAuthenticate, acceptBooking);
vendorDashboardRouter.post("/bookings/complete", vendorAuthenticate, completeBooking);
vendorDashboardRouter.post("/bookings/cancel", vendorAuthenticate, cancelBooking);
vendorDashboardRouter.post("/bank", vendorAuthenticate, addBankDetails);


vendorDashboardRouter.get("/profile", vendorAuthenticate, getUserProfile);
vendorDashboardRouter.patch("/profile/edit", vendorAuthenticate, upload.single("profilePhoto"), editProfile);
vendorDashboardRouter.patch("/driver-profile/edit", vendorAuthenticate, upload.single("profilePhoto"), editDriverProfile);
vendorDashboardRouter.patch('/driver/update', vendorAuthenticate, uploadServiceImages, updatecarDetails);


export default vendorDashboardRouter;