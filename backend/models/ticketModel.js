import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
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
        vendorName: {
            type: String,
        },
        bookingID: {
            type: String,
            required: true,
        },
        ticketID: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["in progress", "opened", "resolved"],
            default: "opened",
        },
        conflict: {
            type: String,
            required: true,
        },
        image: {
            publicId: { type: String },
            url: { type: String }
        },
    },
    { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
