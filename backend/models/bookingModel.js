import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
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
        price: {
            type: Number,
            required: true
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["in progress", "cancelled", "completed"],
            default: "in progress",
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
