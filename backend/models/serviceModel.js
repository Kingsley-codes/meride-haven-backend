import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    profilePhoto: {
        publicId: String,
        url: String,
        required: true
    }
});

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true
    },
    vendorName: {
        type: String,
        required: true
    },
    vendorId: {
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
    servicetype: {
        type: String,
        required: true,
        enum: ['security', 'hospitality', 'car rental', 'driving', 'events', 'cruise']
    },
    isavailable: {
        type: Boolean,
        default: true
    },
    driver: {
        type: driverSchema,
        required: function () {
            return this.servicetype === 'car rental';
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
