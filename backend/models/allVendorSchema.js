import mongoose from "mongoose";

export const bankSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    accNumber: {
        type: String,
        required: true
    }
})



export const driverSchema = new mongoose.Schema({
    availability: {
        type: [String],
    },
    state: {
        type: [String],
        required: true
    },
    experience: {
        type: Number,
    },
    vehicleOwner: {
        type: Boolean,
    },
    bio: {
        type: String,
    },
    vehicleDetails: {
        type: String,
        required: function () {
            return this.vehicleOwner; // Required if vehicleOwner is true
        },
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
});