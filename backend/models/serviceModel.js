import mongoose from "mongoose";
import { carRentalSchema, apartmentSchema, cruiseSchema, eventSchema, securitySchema } from "./allServiceSchema.js";

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true
    },
    vendorName: {
        type: String,
        required: true
    },
    vendorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['security', 'apartment', 'car rental', 'event', 'cruise']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    availability: {
        type: String,
        enum: ['daily', 'hourly', 'event-based'],
        required: true
    },
    CarDetails: {
        type: carRentalSchema,
        required: function () {
            return this.serviceType === 'car rental';
        }
    },
    apartmentDetails: {
        type: apartmentSchema,
        required: function () {
            return this.serviceType === 'apartment';
        }
    },
    cruiseDetails: {
        type: cruiseSchema,
        required: function () {
            return this.serviceType === 'cruise';
        }
    },
    eventDetails: {
        type: eventSchema,
        required: function () {
            return this.serviceType === 'event';
        }
    },
    securityDetails: {
        type: securitySchema,
        required: function () {
            return this.serviceType === 'security';
        }
    },
    price: {
        type: Number,
        required: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    image1: {
        publicId: { type: String },
        url: { type: String }
    },
    image2: {
        publicId: { type: String },
        url: { type: String }
    },
    image3: {
        publicId: { type: String },
        url: { type: String }
    },
    approvedStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    declineReason: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
