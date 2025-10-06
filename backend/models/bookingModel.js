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
            enum: ['security', 'hospitality', 'car rental', 'driving', 'events', 'cruise']
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
            enum: ["in progress", "cancelled", "pending", "failed", "completed"],
            default: "pending",
        },

        // for other services excluding events
        duration: {
            type: Number,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },

        // for other services excluding events and hospitality
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
