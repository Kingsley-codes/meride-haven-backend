import express from "express";
import {
    activateClient,
    editProfile,
    editUserRole,
    fetchAllAdmins,
    fetchAllBookings,
    fetchAllClients,
    fetchSingleClient,
    getBookingAnalytics,
    getUserProfile,
    inviteAdmin,
    resendInvitation,
    setPassword,
    suspendClient
} from "../controllers/adminDashboardController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";



const adminDashboardRouter = express.Router();


adminDashboardRouter.get("/bookings", adminAuthenticate, fetchAllBookings);
adminDashboardRouter.get("/clients", adminAuthenticate, fetchAllClients);
adminDashboardRouter.get("/clients/:clientID", adminAuthenticate, fetchSingleClient);
adminDashboardRouter.get("/analytics", adminAuthenticate, getBookingAnalytics);
adminDashboardRouter.get("/admins", adminAuthenticate, fetchAllAdmins);
adminDashboardRouter.post("/clients/suspend", adminAuthenticate, suspendClient);
adminDashboardRouter.post("/clients/activate", adminAuthenticate, activateClient);
adminDashboardRouter.post("/invite", adminAuthenticate, inviteAdmin);
adminDashboardRouter.post("/password", setPassword);
adminDashboardRouter.post("/resend", adminAuthenticate, resendInvitation);
adminDashboardRouter.patch("/edit", adminAuthenticate, editUserRole);
adminDashboardRouter.patch("/profile/edit", adminAuthenticate, upload.single("profilePhoto"), editProfile);
adminDashboardRouter.get("/profile", adminAuthenticate, getUserProfile);




export default adminDashboardRouter;