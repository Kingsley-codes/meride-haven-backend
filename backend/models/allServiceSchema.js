import mongoose from "mongoose";
import { type } from "os";

export const apartmentSchema = new mongoose.Schema({
    apartmentType: {
        type: String,
        required: true
    },
    numOfRooms: {
        type: Number,
        required: true
    },
    numOfBathrooms: {
        type: Number,
    },
    amenities: {
        type: [String],
        required: true
    },
    securityDeposit: {
        type: Number,
        required: true
    },
    rules: {
        type: [String],
    }
});


export const carRentalSchema = new mongoose.Schema({
    carModel: {
        type: String,
        required: true
    },
    carSeats: {
        type: String,
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    driverDescription: {
        type: String,
        required: true
    },
    driverProfilePhoto: {
        publicId: { type: String },
        url: { type: String }
    },
    minBooking: {
        type: Number,
        required: true
    },
});


export const cruiseSchema = new mongoose.Schema({
    cruiseType: {
        type: String,
        required: true
    },
    minDuration: {
        type: String,
        required: true
    },
    amenities: {
        type: [String],
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    dockingPoint: {
        type: String,
        required: true
    },
});


export const eventSchema = new mongoose.Schema({
    capacity: {
        type: Number,
        required: true
    },
    amenities: {
        type: [String],
        required: true
    },
    venueType: {
        type: String,
        required: true
    },
    rules: {
        type: [String],
    },
    cateringOptions: {
        type: [String],
    },
});


export const securitySchema = new mongoose.Schema({
    personnelType: {
        type: String,
        required: true
    },
    numOfPersonnel: {
        type: Number,
        required: true
    },
    coverageArea: {
        type: [String],
        required: true
    },
    uniformType: {
        type: String,
        required: true
    },
    armed: {
        type: Boolean,
        required: true
    },
});