import express from "express";
import { activateClient, fetchAllBookings, fetchAllClients, fetchSingleClient, suspendClient } from "../controllers/adminDashboardController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddleware.js";



const adminDashboardRouter = express.Router();


adminDashboardRouter.get("/bookings", adminAuthenticate, fetchAllBookings);
adminDashboardRouter.get("/clients", adminAuthenticate, fetchAllClients);
adminDashboardRouter.get("/clients/:clientID", adminAuthenticate, fetchSingleClient);
adminDashboardRouter.post("/clients/suspend", adminAuthenticate, suspendClient);
adminDashboardRouter.post("/clients/activate", adminAuthenticate, activateClient);


export default adminDashboardRouter;