import mongoose from "mongoose";
import validator from "validator";


const driverSchema = new mongoose.Schema({
    availability: {
        type: String,
        enum: ['full-time', 'part-time'],
        required: true
    },
    period: {
        type: String,
        required: function () {
            return this.availability === 'part-time'; // Required if availability is part-time
        },
    },
    experience: {
        type: Number,
        required: true
    },
    vehicleOwner: {
        type: Boolean,
        required: true
    },
    vehicleDetails: {
        type: String,
        required: function () {
            return this.vehicleOwner; // Required if vehicleOwner is true
        },
    },
    passport: {
        publicId: { type: String, required: true },
        url: { type: String, required: true }
    },
    license: {
        publicId: { type: String, required: true },
        url: { type: String, required: true }
    },
    address: {
        publicId: { type: String, required: true },
        url: { type: String, required: true }
    }
});


const vendorSchema = new mongoose.Schema({
    businessName: {
        type: String,
        sparse: true,
        trim: true
    },
    vendorName: {
        type: String,
        trim: true
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
    vendortype: {
        type: String,
        enum: ['others', 'driver'],
        default: 'others'
    },
    approvedStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    driverDetails: {
        type: driverSchema,
        required: function () {
            return this.vendortype === 'driver';
        }
    },
    cac: {
        publicId: String,
        url: String
    },
    directorID: {
        publicId: String,
        url: String
    },
    kycuploaded: {
        type: Boolean,
        default: false
    },
    address: {
        publicId: String,
        url: String
    },
},
    { timestamps: true }
);


const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
