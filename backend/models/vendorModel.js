import mongoose from "mongoose";
import validator from "validator";

const vendorSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
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
        required: true,
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
    isApproved: {
        type: Boolean,
        default: false
    },
    cacCertificate: {
        publicId: String,
        url: String
    },
    directorID: {
        publicId: String,
        url: String
    },
    businessAddress: {
        publicId: String,
        url: String
    },
},
    { timestamps: true }
);


const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
