import express from "express";
import {
    createBooking,
    verifyPayment,
    handleErcasWebhook
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// Route to create a new booking
bookingRouter.post("/create", createBooking);

// Route to verify payment
bookingRouter.post("/verify", verifyPayment);

// Route to handle payment webhook
bookingRouter.post("/webhook", handleErcasWebhook);


export default bookingRouter;