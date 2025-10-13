import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";


//  Handle successful payment and activate booking
export const handleSuccessfulPayment = async (eventData) => {
    try {

        if (!eventData) {
            throw new Error("Event data is required");
        }

        const metadata = typeof eventData.metadata === "string"
            ? JSON.parse(eventData.metadata)
            : eventData.metadata;

        const booking = await Booking.findOne({ paymentReference: eventData.payment_reference });
        if (!booking) {
            throw new Error("Booking not found");
        }

        // If payment is successful, update booking status
        booking.status = "upcoming";
        booking.paymentStatus = "completed"
        await booking.save();

        const client = await User.findOne({ phone: booking.clientEmail });

        if (!client) {
            console.log("User not found for: ", booking.clientEmail);
            throw new Error("User not found");
        }

        client.bookings += 1;
        client.lastBooking = new Date();
        await client.save();


        return booking;
    } catch (error) {
        console.log(error);
        throw error;
    }
};


// Handle failed payment and mark booking as failed
export const handleFailedPayment = async (eventData) => {
    try {
        if (!eventData) {
            throw new Error("Event data is required");
        }

        const booking = await Booking.findOne({ paymentReference: eventData.paymentReference });
        if (!booking) {
            throw new Error("Booking not found");
        }

        // If payment failed, update booking status
        booking.status = "failed";
        booking.paymentStatus = "failed";
        await booking.save();

        return booking;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
