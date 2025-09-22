import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";
import { v2 as cloudinary } from 'cloudinary';


export const createService = async (req, res) => {
    try {
        const vendorID = req.vendorId;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to create service for this vendor"
            });
        }

        const vendor = await Vendor.findById(vendorID);
        if (!vendor) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        if (vendor.approvedStatus !== 'approved') {
            return res.status(403).json({
                message: "Vendor is not approved to create services"
            });
        }


        const { serviceName, location, description, servicetype, price, driverName, driverDescription } = req.body;

        const serviceImages = req.files?.images || [];
        const driverPhotoFile = req.files?.driverPhoto?.[0];

        if (!serviceName || !location || !description || !servicetype || !price) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Validate service images (1-3)
        if (serviceImages.length === 0) {
            return res.status(400).json({
                message: "At least one service image is required"
            });
        }
        if (serviceImages.length > 3) {
            return res.status(400).json({
                message: "Maximum 3 service images allowed"
            });
        }

        if (servicetype === 'car rental') {
            if (!driverName || !driverDescription || !driverPhotoFile) {
                return res.status(400).json({
                    message: "All driver fields are required"
                });
            }
        }

        // Upload service images
        const uploadedServiceImages = [];
        for (const image of serviceImages) {
            const result = await cloudinary.uploader.upload(image.path, {
                folder: 'MerideHaven/serviceImages'
            });
            uploadedServiceImages.push({
                publicId: result.public_id,
                url: result.secure_url
            });
        }

        // Upload driver photo if needed
        let driverProfile = {};
        if (servicetype === 'car rental' && driverPhotoFile) {
            const driverPhotoResult = await cloudinary.uploader.upload(driverPhotoFile.path, {
                folder: 'MerideHaven/driverPhotos'
            });
            driverProfile = {
                publicId: driverPhotoResult.public_id,
                url: driverPhotoResult.secure_url
            };
        }

        const newService = await Service.create({
            serviceName,
            vendorName: vendor.vendorName,
            vendorId: vendorID,
            location,
            description,
            images: uploadedServiceImages,
            servicetype,
            driver: servicetype === 'car rental' ? {
                driverName,
                driverDescription,
                driverProfilePhoto: driverProfile
            } : undefined,
            price
        });

        await newService.save();
        res.status(201).json({
            message: "Service created successfully",
            service: newService
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating service", error: error.message });
    }
};


export const getVendorServices = async (req, res) => {
    try {
        const vendorID = req.vendorId;
        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to view services for this vendor"
            });
        }
        const services = await Service.find({ vendorId: vendorID });
        res.status(200).json({ services });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching services",
            error: error.message
        });
    }
};


export const deleteService = async (req, res) => {
    try {
        const { serviceId } = req.body;
        const vendorID = req.vendorId;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to delete services for this vendor"
            });
        }
        const service = await Service.findOneAndDelete({ _id: serviceId, vendorId: vendorID });
        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        res.status(200).json({
            message: "Service deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting service",
            error: error.message
        });
    }
};

export const updateService = async (req, res) => {
    try {
        const { serviceId, serviceName, location, description, isavailable, price, driverName, driverDescription, driverProfilePhoto } = req.body;

        const vendorID = req.vendorId;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to update services for this vendor"
            });
        }

        const service = await Service.findOne({ _id: serviceId, vendorId: vendorID });

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        if (serviceName) service.serviceName = serviceName;
        if (location) service.location = location;
        if (description) service.description = description;
        if (price) service.price = price;
        if (typeof isavailable === 'boolean') service.isavailable = isavailable;
        // Update driver details only if the service type is 'car rental'
        if (service.servicetype === 'car rental') {
            if (driverName) service.driver.driverName = driverName;
            if (driverDescription) service.driver.driverDescription = driverDescription;
            if (driverProfilePhoto) service.driver.driverProfilePhoto = driverProfilePhoto;
        }

        await service.save();
        res.status(200).json({
            message: "Service updated successfully",
            service
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating service",
            error: error.message
        });
    }
};