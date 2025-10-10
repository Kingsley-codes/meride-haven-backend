import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        clientName: {
            type: String,
            required: true,
        },
        clientNumber: {
            type: String,
            required: true,
        },
        clientEmail: {
            type: String,
            required: true,
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
        },
        serviceType: {
            type: String,
            required: true,
        },
        serviceName: {
            type: String,
        },
        bookingID: {
            type: String,
            required: true,
        },
        paymentReference: {
            type: String,
            required: true,
            unique: true,
        },
        transactionReference: {
            type: String,
            required: true,
            unique: true,
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["in progress", "cancelled", "failed", "pending", "completed"],
            default: "pending",
        },
        PaymentStatus: {
            type: String,
            enum: ["pending", "failed", "completed", "refunded"],
            default: "pending",
        },

        // for other services excluding events
        duration: {
            type: Number,
        },
        startDate: {
            type: Date,
        },

        // for other services excluding events and hospitality and cruise
        address: {
            type: String,
        },
        state: {
            type: String,
        },

        // for hospitality service
        securityDeposit: {
            type: Number,
        },

        // for other services excluding events
        time: {
            type: String,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },

    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
