import Booking from "../models/bookingModel.js";


//  Handle successful payment and activate booking
export const handleSuccessfulPayment = async (eventData) => {
    try {

        if (!eventData) {
            throw new Error("Event data is required");
        }

        const booking = await Booking.findOne({ paymentReference: eventData.payment_reference });
        if (!booking) {
            throw new Error("Booking not found");
        }

        // If payment is successful, update booking status
        booking.status = "in progress";
        booking.PaymentStatus = "completed"
        await booking.save();

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
        booking.PaymentStatus = "failed";
        await booking.save();

        return booking;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
