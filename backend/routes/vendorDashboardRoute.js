import express from "express";
import {
    acceptBooking,
    addBankDetails,
    cancelBooking,
    editProfile,
    fetchAllBookings,
    fetchReviews,
    fetchVendorDashoboard,
    getUserProfile,
    getVendorEarnings,
    rejectBooking
} from "../controllers/vendorDashboardController.js";
import { vendorAuthenticate } from "../middleware/authenticationMiddleware.js";
import { singleUpload } from '../middleware/uploadMiddleware.js';



const vendorDashboardRouter = express.Router();


vendorDashboardRouter.get("/", vendorAuthenticate, fetchVendorDashoboard);
vendorDashboardRouter.get("/bookings", vendorAuthenticate, fetchAllBookings);
vendorDashboardRouter.get("/reviews", vendorAuthenticate, fetchReviews);
vendorDashboardRouter.get("/earnings", vendorAuthenticate, getVendorEarnings);
vendorDashboardRouter.post("/bookings/reject", vendorAuthenticate, rejectBooking);
vendorDashboardRouter.post("/bookings/accept", vendorAuthenticate, acceptBooking);
vendorDashboardRouter.post("/bookings/cancel", vendorAuthenticate, cancelBooking);
vendorDashboardRouter.post("/bank", vendorAuthenticate, addBankDetails);


vendorDashboardRouter.get("/profile", vendorAuthenticate, getUserProfile);
vendorDashboardRouter.patch("/profile/edit", vendorAuthenticate, singleUpload.single("profilePhoto"), editProfile);


export default vendorDashboardRouter;