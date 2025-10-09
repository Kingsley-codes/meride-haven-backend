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


        const {
            serviceName, location, description,
            serviceType, availability, price,
            apartmentType, numOfRooms, numOfBathrooms,
            amenities, securityDeposit, rules,
            carModel, minBooking, carSeats,
            driverName, driverDescription,
            cruiseType, capacity, dockingPoint,
            venueType, cateringOptions,
            personnelType, numOfPersonnel, coverageArea,
            uniformType, armed
        } = req.body;

        const driverPhotoFile = req.files?.driverPhoto?.[0];
        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];

        // Track all files for cleanup
        if (image1) filesToCleanup.push(image1);
        if (image2) filesToCleanup.push(image2);
        if (image3) filesToCleanup.push(image3);
        if (driverPhotoFile) filesToCleanup.push(driverPhotoFile);

        if (!serviceName || !location || !description || !serviceType || !price || !availability) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (serviceType === "apartment" && (!apartmentType || !numOfRooms || !numOfBathrooms ||
            !amenities || !securityDeposit || !rules)) {
            return res.status(400).json({
                message: "Please fill the necessary fields required for hospitality"
            });
        }

        if (serviceType === "car rental" && (!driverName || !driverDescription || !driverPhotoFile
            || !carModel || !minBooking || !carSeats)) {
            return res.status(400).json({
                message: "Please fill the necessary fields required for car rental"
            });
        }

        if (serviceType === "events" && (!capacity || !venueType || !cateringOptions ||
            !amenities || !rules)) {
            return res.status(400).json({
                message: "Please fill the necessary fields required for events"
            });
        }

        if (serviceType === "cruise" && (!cruiseType || !minBooking || !capacity ||
            !amenities || !dockingPoint)) {
            return res.status(400).json({
                message: "Please fill the necessary fields required for cruise"
            });
        }

        if (serviceType === "security" && (!personnelType || !numOfPersonnel || !coverageArea ||
            !uniformType || !armed)) {
            return res.status(400).json({
                message: "Please fill the necessary fields required for security"
            });
        }

        // Validate service images (1-3)
        if ([image1, image2, image3].length === 0) {
            return res.status(400).json({
                message: "At least one service image is required"
            });
        }
        if ([image1, image2, image3].length > 3) {
            return res.status(400).json({
                message: "Maximum 3 service images allowed"
            });
        }

        // Upload service images

        let image1Result = {};
        if (image1) {
            const result = await cloudinary.uploader.upload(image1.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image1Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image1.path)) {
                fs.unlinkSync(image1.path);
            }
        }

        let image2Result = {};
        if (image2) {
            const result = await cloudinary.uploader.upload(image2.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image2Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image2.path)) {
                fs.unlinkSync(image2.path);
            }
        }

        let image3Result = {};
        if (image3) {
            const result = await cloudinary.uploader.upload(image3.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image3Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image3.path)) {
                fs.unlinkSync(image3.path);
            }
        }

        // Upload driver photo if needed
        let driverProfile = {};
        if (serviceType === 'car rental' && driverPhotoFile) {
            const driverPhotoResult = await cloudinary.uploader.upload(driverPhotoFile.path, {
                folder: 'Meride Haven/driverPhotos'
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
            vendorID,
            location,
            description,
            availability,
            image1: image1 ? image1Result : undefined,
            image2: image2 ? image2Result : undefined,
            image3: image3 ? image3Result : undefined,
            serviceType,
            price,
            CarDetails: serviceType === 'car rental' ? {
                carModel,
                carSeats,
                minBooking,
                driverName,
                driverDescription,
                driverProfilePhoto: driverProfile
            } : undefined,
            apartmentDetails: serviceType === "apartment" ? {
                apartmentType,
                numOfRooms,
                numOfBathrooms,
                amenities,
                securityDeposit,
                rules
            } : undefined,
            cruiseDetails: serviceType === "cruise" ? {
                cruiseType,
                minBooking,
                amenities,
                capacity,
                dockingPoint
            } : undefined,
            eventDetails: serviceType === "event" ? {
                capacity,
                amenities,
                venueType,
                rules,
                cateringOptions
            } : undefined,
            securityDetails: serviceType === "security" ? {
                personnelType,
                numOfPersonnel,
                coverageArea,
                uniformType,
                armed
            } : undefined
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
        const services = await Service.find({ vendorID: vendorID });
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

        const {
            serviceName, location, description,
            serviceId, availability, price, isAvailable,
            apartmentType, numOfRooms, numOfBathrooms,
            amenities, securityDeposit, rules,
            carModel, minBooking, carSeats,
            driverName, driverDescription,
            cruiseType, capacity, dockingPoint,
            venueType, cateringOptions,
            personnelType, numOfPersonnel, coverageArea,
            uniformType, armed
        } = req.body;

        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];
        const driverPhotoFile = req.files?.driverPhoto?.[0];

        // Track all files for cleanup
        if (image1) filesToCleanup.push(image1);
        if (image2) filesToCleanup.push(image2);
        if (image3) filesToCleanup.push(image3);

        if (!serviceId) {
            return res.status(400).json({
                message: "Service ID is required"
            });
        }

        const service = await Service.findOne({ _id: serviceId, vendorID: vendorID });

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
        if (typeof isAvailable === 'boolean') service.isAvailable = isAvailable;

        // Handle service images update

        if ([image1, image2, image3].length > 3) {
            return res.status(400).json({
                message: "Maximum 3 service images allowed"
            });
        }

        let image1Result = {};
        if (image1) {
            const result = await cloudinary.uploader.upload(image1.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image1Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image1.path)) {
                fs.unlinkSync(image1.path);
            }

            let oldImage1 = service.image1;
            // Delete old image1 from Cloudinary
            if (oldImage1?.publicId) {
                try {
                    await cloudinary.uploader.destroy(oldImage1.publicId);
                } catch (error) {
                    console.error("Error deleting old image1:", error);
                }
            }
        }

        service.image1 = image1Result;

        let image2Result = {};
        if (image2) {
            const result = await cloudinary.uploader.upload(image2.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image2Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image2.path)) {
                fs.unlinkSync(image2.path);
            }

            let oldImage2 = service.image2;
            // Delete old image2 from Cloudinary
            if (oldImage2?.publicId) {
                try {
                    await cloudinary.uploader.destroy(oldImage2.publicId);
                } catch (error) {
                    console.error("Error deleting old image2:", error);
                }
            }
        }

        service.image2 = image2Result;

        let image3Result = {};
        if (image3) {
            const result = await cloudinary.uploader.upload(image3.path, {
                folder: 'Meride Haven/serviceImages'
            });

            image3Result = {
                publicId: result.public_id,
                url: result.secure_url
            };

            // Delete file immediately after upload
            if (fs.existsSync(image3.path)) {
                fs.unlinkSync(image3.path);
            }

            let oldImage3 = service.image3;
            // Delete old image3 from Cloudinary
            if (oldImage3?.publicId) {
                try {
                    await cloudinary.uploader.destroy(oldImage3.publicId);
                } catch (error) {
                    console.error("Error deleting old image3:", error);
                }
            }
        }
        service.image3 = image3Result;


        // Handle differnt service types
        switch (service.serviceType) {
            // Apartment edit
            case 'apartment':

                if (apartmentType) {
                    service.apartmentDetails.apartmentType = apartmentType
                }
                if (numOfRooms) {
                    service.apartmentDetails.numOfRooms = numOfRooms
                }
                if (numOfBathrooms) {
                    service.apartmentDetails.numOfBathrooms = numOfBathrooms
                }
                if (amenities) {
                    service.apartmentDetails.amenities = amenities
                }
                if (securityDeposit) {
                    service.apartmentDetails.securityDeposit = securityDeposit
                }
                if (rules) {
                    service.apartmentDetails.rules = rules
                }
                break;

            // Update car details
            case 'car rental':

                if (driverName) service.CarDetails.driverName = driverName;
                if (carModel) service.CarDetails.carModel = carModel;
                if (carSeats) service.CarDetails.carSeats = carSeats;
                if (minBooking) service.CarDetails.minBooking = minBooking;
                if (driverDescription) service.CarDetails.driverDescription = driverDescription;

                if (driverPhotoFile) {
                    try {
                        const driverPhotoResult = await cloudinary.uploader.upload(driverPhotoFile.path, {
                            folder: 'MerideHaven/driverPhotos'
                        });

                        // Delete old driver photo
                        if (service.CarDetails.driverProfilePhoto?.publicId) {
                            try {
                                await cloudinary.uploader.destroy(service.CarDetails.driverProfilePhoto.publicId);
                            } catch (error) {
                                console.error("Error deleting old driver photo:", error);
                            }
                        }

                        service.CarDetails.driverProfilePhoto = {
                            publicId: driverPhotoResult.public_id,
                            url: driverPhotoResult.secure_url
                        };
                    } finally {
                        if (fs.existsSync(driverPhotoFile.path)) {
                            fs.unlinkSync(driverPhotoFile.path);
                        }
                    }
                }
                break;

            // Update security details
            case 'security':

                if (personnelType) {
                    service.securityDetails.personnelType = personnelType
                }
                if (numOfPersonnel) {
                    service.securityDetails.numOfPersonnel = numOfPersonnel
                }
                if (coverageArea) {
                    service.securityDetails.coverageArea = coverageArea
                }
                if (uniformType) {
                    service.securityDetails.uniformType = uniformType
                }
                if (securityDeposit) {
                    service.securityDetails.securityDeposit = armed
                }

                break;

            // Update car details
            case 'cruise':

                if (cruiseType) {
                    service.cruiseDetails.cruiseType = cruiseType
                }
                if (minBooking) {
                    service.cruiseDetails.minBooking = minBooking
                }
                if (amenities) {
                    service.cruiseDetails.amenities = amenities
                }
                if (capacity) {
                    service.cruiseDetails.capacity = capacity
                }
                if (dockingPoint) {
                    service.cruiseDetails.dockingPoint = dockingPoint
                }

                break;

            // Update car details
            case 'event':

                if (capacity) {
                    service.eventSchema.capacity = capacity
                }
                if (amenitiesvenueType) {
                    service.eventSchema.amenitiesvenueType = amenitiesvenueType
                }
                if (venueType) {
                    service.eventSchema.venueType = venueType
                }
                if (rules) {
                    service.eventSchema.rules = rules
                }
                if (cateringOptions) {
                    service.eventSchema.cateringOptions = cateringOptions
                }

                break;

            default:
                console.log(`Unhandled service type: ${serviceType}`);
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