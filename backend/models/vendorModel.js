import mongoose from "mongoose";
import validator from "validator";


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
    suspendReason: {
        type: String
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
    averageRating: {
        type: Number,
        default: 0
    },
    completedBookings: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    profilePhoto: {
        publicId: { type: String },
        url: { type: String }
    },
}, { timestamps: true }
);


const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
