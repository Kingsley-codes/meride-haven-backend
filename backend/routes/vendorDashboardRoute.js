import express from "express";
import {
    acceptBooking,
    cancelBooking,
    fetchAllBookings, fetchReviews, rejectBooking
} from "../controllers/vendorDashboardController.js";
import { vendorAuthenticate } from "../middleware/authenticationMiddleware.js";



const vendorDashboardRouter = express.Router();


vendorDashboardRouter.get("/bookings", vendorAuthenticate, fetchAllBookings);
vendorDashboardRouter.get("/reviews", vendorAuthenticate, fetchReviews);
vendorDashboardRouter.post("/bookings/reject", vendorAuthenticate, rejectBooking);
vendorDashboardRouter.post("/bookings/accept", vendorAuthenticate, acceptBooking);
vendorDashboardRouter.post("/bookings/cancel", vendorAuthenticate, cancelBooking);


export default vendorDashboardRouter;