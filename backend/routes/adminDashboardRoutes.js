import express from "express";
import { fetchAllBookings } from "../controllers/adminDashboardController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddleware.js";



const adminDashboardRouter = express.Router();


adminDashboardRouter.get("/bookings", adminAuthenticate, fetchAllBookings);


export default adminDashboardRouter;