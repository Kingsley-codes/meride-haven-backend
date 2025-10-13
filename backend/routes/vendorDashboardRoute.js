import express from "express";
import {
    acceptBooking,
    cancelBooking,
    editProfile,
    editProfileRequest,
    fetchAllBookings,
    fetchReviews,
    getUserProfile,
    getVendorEarnings,
    rejectBooking
} from "../controllers/vendorDashboardController.js";
import { vendorAuthenticate } from "../middleware/authenticationMiddleware.js";
import { singleUpload } from '../middleware/uploadMiddleware.js';



const vendorDashboardRouter = express.Router();


vendorDashboardRouter.get("/bookings", vendorAuthenticate, fetchAllBookings);
vendorDashboardRouter.get("/reviews", vendorAuthenticate, fetchReviews);
vendorDashboardRouter.get("/earnings", vendorAuthenticate, getVendorEarnings);
vendorDashboardRouter.post("/bookings/reject", vendorAuthenticate, rejectBooking);
vendorDashboardRouter.post("/bookings/accept", vendorAuthenticate, acceptBooking);
vendorDashboardRouter.post("/bookings/cancel", vendorAuthenticate, cancelBooking);


vendorDashboardRouter.get("/profile", vendorAuthenticate, getUserProfile);
vendorDashboardRouter.post("/profile/edit-request", vendorAuthenticate, editProfileRequest);
vendorDashboardRouter.patch("/profile/edit", vendorAuthenticate, singleUpload.single("profilePhoto"), editProfile);
vendorDashboardRouter.post("/profile/resend", vendorAuthenticate, editProfileRequest);


export default vendorDashboardRouter;