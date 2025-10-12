import express from 'express';
import { bookingRatingController, cancelBooking, completeBooking, fetchAllBookings } from '../controllers/userDashboardController.js';
import { userAuthenticate } from '../middleware/authenticationMiddleware.js';


const userDashboardRouter = express.Router();

userDashboardRouter.get("/bookings", userAuthenticate, fetchAllBookings);
userDashboardRouter.post("/bookings/cancel", userAuthenticate, cancelBooking);
userDashboardRouter.post("/bookings/complete", userAuthenticate, completeBooking);
userDashboardRouter.post("/bookings/rate", userAuthenticate, bookingRatingController);


export default userDashboardRouter;