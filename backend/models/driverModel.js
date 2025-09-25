import mongoose from "mongoose";
import validator from "validator";


const driverSchema = new mongoose.Schema({
    driverName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: "Invalid email format"
        }
    },
    phone: {
        type: String,
        sparse: true,
        unique: true,
        trim: true,
        validate: {
            validator: validator.isMobilePhone,
            message: "Invalid phone number format"
        }
    },
    googleID: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        // Make password required only for non-Google signups
        required: function () {
            return !this.googleID; // Required if googleID is not present
        },
        minlength: 8
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    approvedStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    declineReason: {
        type: String
    },
    availability: {
        type: String,
        enum: ['full-time', 'part-time'],
    },
    period: {
        type: String,
        required: function () {
            return this.availability === 'part-time'; // Required if availability is part-time
        },
    },
    city: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
    },
    vehicleOwner: {
        type: Boolean,
    },
    vehicleDetails: {
        type: String,
        required: function () {
            return this.vehicleOwner; // Required if vehicleOwner is true
        },
    },
    passport: {
        publicId: { type: String },
        url: { type: String }
    },
    license: {
        publicId: { type: String },
        url: { type: String }
    },
    address: {
        publicId: { type: String },
        url: { type: String }
    },
    completedBookings: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    }
},
    { timestamps: true }
);

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;