import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
    driverName: {
        type: String,
        required: true
    },
    driverDescription: {
        type: String,
        required: true
    },
    driverProfilePhoto: {
        publicId: { type: String, required: true },
        url: { type: String, required: true }
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
    availability: {
        type: String,
        enum: ['daily', 'hourly', 'event-based'],
        required: true
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
    numOfReviews: {
        type: Number,
        default: 0
    },
    images: {
        type: [
            {
                publicId: { type: String, required: true },
                url: { type: String, required: true }
            }
        ],
        required: true
    },
    approvedStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
