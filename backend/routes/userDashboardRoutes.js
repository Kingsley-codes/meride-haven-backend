import express from 'express';
import {
    bookingRatingController,
    cancelBooking,
    completeBooking,
    createTicket,
    editProfile,
    fetchAllBookings,
    fetchAllTickets,
    getUserProfile
} from '../controllers/userDashboardController.js';
import { userAuthenticate } from '../middleware/authenticationMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';


const userDashboardRouter = express.Router();

userDashboardRouter.get("/profile", userAuthenticate, getUserProfile);
userDashboardRouter.patch("/profile/edit", userAuthenticate, upload.single("profilePhoto"), editProfile);

userDashboardRouter.get("/bookings", userAuthenticate, fetchAllBookings);
userDashboardRouter.post("/bookings/cancel", userAuthenticate, cancelBooking);
userDashboardRouter.post("/bookings/complete", userAuthenticate, completeBooking);
userDashboardRouter.post("/bookings/rate", userAuthenticate, bookingRatingController);

userDashboardRouter.get("/tickets", userAuthenticate, fetchAllTickets);
userDashboardRouter.post("/tickets/create", userAuthenticate, upload.array("images", 5), createTicket);


export default userDashboardRouter;