import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


export const createService = async (req, res) => {
    let filesToCleanup = []; // Track files for cleanup

    try {
        const vendorID = req.vendor._id;

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


        const { serviceName, location, description, servicetype, availability, price, driverName, driverDescription } = req.body;

        const serviceImages = req.files?.images || [];
        const driverPhotoFile = req.files?.driverPhoto?.[0];

        // Track all files for cleanup
        if (serviceImages.length > 0) filesToCleanup.push(...serviceImages);
        if (driverPhotoFile) filesToCleanup.push(driverPhotoFile);

        if (!serviceName || !location || !description || !servicetype || !price || !availability) {

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

            // Delete file immediately after upload
            if (fs.existsSync(image.path)) {
                fs.unlinkSync(image.path);
            }
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

            // Delete file immediately after upload
            if (fs.existsSync(driverPhotoFile.path)) {
                fs.unlinkSync(driverPhotoFile.path);
            }
        }

        const newService = await Service.create({
            serviceName,
            vendorName: vendor.businessName,
            vendorId: vendorID,
            location,
            description,
            availability,
            images: uploadedServiceImages,
            servicetype,
            driver: servicetype === 'car rental' ? {
                driverName,
                driverDescription,
                driverProfilePhoto: driverProfile
            } : undefined,
            price
        });


        res.status(201).json({
            message: "Service created successfully",
            service: newService
        });
    } catch (error) {
        // Cleanup any remaining files on error
        filesToCleanup.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }
        });
        res.status(500).json({
            message: "Error creating service",
            error: error.message
        });
    }
};


export const getVendorServices = async (req, res) => {
    try {
        const vendorID = req.vendor._id;
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
        const vendorID = req.vendor._id;

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
        const vendorID = req.vendor._id;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to update services for this vendor"
            });
        }

        const { serviceId, serviceName, location, description, availability, isavailable, price, driverName, driverDescription } = req.body;

        const serviceImages = req.files?.images || [];
        const driverPhotoFile = req.files?.driverPhoto?.[0];

        if (!serviceId) {
            return res.status(400).json({
                message: "Service ID is required"
            });
        }

        const service = await Service.findOne({ _id: serviceId, vendorId: vendorID });

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        // Update basic fields
        if (serviceName) service.serviceName = serviceName;
        if (location) service.location = location;
        if (description) service.description = description;
        if (price) service.price = price;
        if (availability) service.availability = availability;
        if (typeof isavailable === 'boolean') service.isavailable = isavailable;

        // Handle service images update
        if (serviceImages.length > 0) {
            if (serviceImages.length > 3) {
                return res.status(400).json({
                    message: "Maximum 3 service images allowed"
                });
            }

            const uploadedServiceImages = [];
            for (const image of serviceImages) {
                try {
                    const result = await cloudinary.uploader.upload(image.path, {
                        folder: 'MerideHaven/serviceImages'
                    });
                    uploadedServiceImages.push({
                        publicId: result.public_id,
                        url: result.secure_url
                    });
                } finally {
                    // Always delete the file
                    if (fs.existsSync(image.path)) {
                        fs.unlinkSync(image.path);
                    }
                }
            }

            // Delete old images from Cloudinary
            if (service.images?.length > 0) {
                for (const oldImage of service.images) {
                    try {
                        await cloudinary.uploader.destroy(oldImage.publicId);
                    } catch (error) {
                        console.error("Error deleting old image:", error);
                    }
                }
            }

            service.images = uploadedServiceImages;
        }

        // Update driver details
        if (service.servicetype === 'car rental') {
            if (driverName) service.driver.driverName = driverName;
            if (driverDescription) service.driver.driverDescription = driverDescription;

            if (driverPhotoFile) {
                try {
                    const driverPhotoResult = await cloudinary.uploader.upload(driverPhotoFile.path, {
                        folder: 'MerideHaven/driverPhotos'
                    });

                    // Delete old driver photo
                    if (service.driver.driverProfilePhoto?.publicId) {
                        try {
                            await cloudinary.uploader.destroy(service.driver.driverProfilePhoto.publicId);
                        } catch (error) {
                            console.error("Error deleting old driver photo:", error);
                        }
                    }

                    service.driver.driverProfilePhoto = {
                        publicId: driverPhotoResult.public_id,
                        url: driverPhotoResult.secure_url
                    };
                } finally {
                    if (fs.existsSync(driverPhotoFile.path)) {
                        fs.unlinkSync(driverPhotoFile.path);
                    }
                }
            }
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