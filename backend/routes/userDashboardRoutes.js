import express from 'express';
import {
    bookingRatingController,
    cancelBooking,
    completeBooking,
    editProfile,
    editProfileRequest,
    fetchAllBookings,
    getUserProfile
} from '../controllers/userDashboardController.js';
import { userAuthenticate } from '../middleware/authenticationMiddleware.js';
import { singleUpload } from '../middleware/uploadMiddleware.js';


const userDashboardRouter = express.Router();

userDashboardRouter.get("/bookings", userAuthenticate, fetchAllBookings);
userDashboardRouter.get("/profile", userAuthenticate, getUserProfile);
userDashboardRouter.post("/profile/edit-request", userAuthenticate, editProfileRequest);
userDashboardRouter.patch("/profile/edit", userAuthenticate, singleUpload.single("profilePhoto"), editProfile);
userDashboardRouter.post("/profile/resend", userAuthenticate, editProfileRequest);
userDashboardRouter.post("/bookings/cancel", userAuthenticate, cancelBooking);
userDashboardRouter.post("/bookings/complete", userAuthenticate, completeBooking);
userDashboardRouter.post("/bookings/rate", userAuthenticate, bookingRatingController);


export default userDashboardRouter;