import Booking from "../models/bookingModel.js";
import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";
import mongoose from "mongoose";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import { bookingCanceled, vendorCancelBooking, sendBookingconfirmationToClient } from "../utils/bookingEmailHelpers.js"



export const fetchAllBookings = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { status, servicetype, q, startDate, endDate } = req.query;

        // Base filter (no vendor yet)
        const filter = {};

        if (status && ["in progress", "cancelled", "upcoming", "pending", "failed", "completed"].includes(status)) {
            filter.status = status;
        }

        if (servicetype && ["security", "apartment", "car rental", "event", "cruise"].includes(servicetype)) {
            filter.serviceType = servicetype;
        }

        if (q) {
            filter.$or = [
                { clientNumber: { $regex: q, $options: "i" } },
                { clientName: { $regex: q, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalBookings = await Booking.countDocuments({
            ...filter,
            vendor: vendor
        });

        const bookings = await Booking.find({
            ...filter,
            vendor: vendor,
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            bookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                perPage: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching bookings",
            error: error.message,
        });
    }
};


export const completeBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find the booking first to check its current status
        const existingBooking = await Booking.findOne({ bookingID, client: user });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }


        if (existingBooking.status !== "in progress") {
            return res.status(400).json({
                success: false,
                message: "You can only complete a service that's in progress",
            });
        }

        if (existingBooking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Booking is already completed",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "completed";

        await existingBooking.save();

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: existingBooking,
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while rejecting the booking",
            error: error.message,
        });
    }
};



export const acceptBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find and update the booking in one go
        const booking = await Booking.findOneAndUpdate(
            { bookingID, vendor: vendor, status: { $ne: "in progress" } },
            { status: "in progress" },
            { new: true } // returns the updated document
        );

        // If not found or already accepted
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or already accepted",
            });
        }

        await sendBookingconfirmationToClient(bookingID);

        return res.status(200).json({
            success: true,
            message: "Booking accepted successfully",
            booking,
        });
    } catch (error) {
        console.error("Error accepting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while accepting the booking",
            error: error.message,
        });
    }
};


export const rejectBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find the booking first to check its current status
        const existingBooking = await Booking.findOne({ bookingID, vendor: vendor });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if booking is already in progress or cancelled
        if (existingBooking.status === "in progress") {
            return res.status(400).json({
                success: false,
                message: "Cannot reject booking that is already in progress",
            });
        }

        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "cancelled";

        await existingBooking.save();

        await vendorCancelBooking(bookingID);
        await bookingCanceled(bookingID);

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while rejecting the booking",
            error: error.message,
        });
    }
};


export const cancelBooking = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Find the booking first to check its current status
        const existingBooking = await Booking.findOne({ bookingID, vendor: vendor });

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }


        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        // Update the booking to cancelled
        existingBooking.status = "cancelled";

        await existingBooking.save();



        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking: existingBooking,
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while rejecting the booking",
            error: error.message,
        });
    }
};



export const fetchReviews = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor); // Vendor authentication middleware
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are unauthorized",
            });
        }



        const { page = 1, limit = 9, sort = "date" } = req.query;
        const skip = (page - 1) * limit;

        // Filter only completed bookings that have a review
        const filter = {
            vendor: vendor._id,
            status: "completed",
            rating: { $gt: 0 },
        };

        // Fetch reviews with pagination
        const reviews = await Booking.find(filter)
            .select("clientName serviceType reviewDescription rating reviewDate")
            .sort({ reviewDate: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Compute total reviews and average rating
        const totalReviews = await Booking.countDocuments(filter);
        const averageRating = vendor.rating


        return res.status(200).json({
            success: true,
            overview: {
                averageRating,
                totalReviews,
            },
            reviews,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalReviews / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching vendor reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
        });
    }
};



export const getVendorEarnings = async (req, res) => {
    try {
        const vendorID = req.vendor;
        if (!vendorID) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { servicetype, q, startDate, endDate } = req.query;

        // Base filter (no vendor yet)
        const filter = {};

        if (servicetype && ["security", "apartment", "car rental", "event", "cruise"].includes(servicetype)) {
            filter.serviceType = servicetype;
        }

        if (q) {
            filter.$or = [
                { bookingID: { $regex: q, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }


        // --- 1. All-time total earnings (all completed bookings) ---
        const allTimeEarnings = await Booking.aggregate([
            { $match: { vendor: new mongoose.Types.ObjectId(vendorID), status: "completed" } },
            { $group: { _id: null, totalEarnings: { $sum: "$price" } } },
        ]);

        // --- 2. This month’s total earnings (completed bookings) ---
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlyEarnings = await Booking.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorID),
                    status: "completed",
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            { $group: { _id: null, totalEarnings: { $sum: "$price" } } },
        ]);

        const totalBookings = await Booking.countDocuments({
            ...filter,
            vendor: vendorID
        });

        // --- Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const bookings = await Booking.find({
            ...filter,
            vendor: vendorID,
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();


        return res.status(200).json({
            success: true,
            vendor: vendorID,
            earnings: {
                allTime: allTimeEarnings[0]?.totalEarnings || 0,
                thisMonth: monthlyEarnings[0]?.totalEarnings || 0,
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                perPage: limit,
            },
            bookings
        });
    } catch (error) {
        console.error("Error fetching vendor earnings:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching vendor earnings",
            error: error.message,
        });
    }
};


export const editProfile = async (req, res) => {
    try {

        const { address, phoneNumber } = req.body;

        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits",
            });
        }

        let profile = await Vendor.findById(vendor);

        if (address !== undefined) {
            profile.businessAddress = address;
        }

        if (phoneNumber !== undefined) {
            profile.phone = phoneNumber;
        }

        // Handle profilePhoto upload if a file is provided
        if (req.file) {

            try {
                // Delete old profilePhoto from Cloudinary if it exists
                if (profile.profilePhoto && profile.profilePhoto.publicId) {
                    await cloudinary.uploader.destroy(profile.profilePhoto.publicId);
                }

                // Upload new profilePhoto to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "Meride Haven/profilePhoto",
                    width: 500,
                    height: 500,
                    crop: "fill"
                });

                // Update profilePhoto in profile
                profile.profilePhoto = {
                    publicId: result.public_id,
                    url: result.secure_url
                };
                // Delete the temporary file after successful upload
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (uploadErr) {

                // Clean up the file if upload fails
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    success: false,
                    message: `Failed to upload image: ${uploadErr.message}`
                });
            }
        };

        // Save the updated profile
        const updatedProfile = await profile.save();

        res.status(200).json({
            success: true,
            message: "Vendor profile updated successfully",
            data: {
                fullName: updatedProfile.fullName,
                address: updatedProfile.businessAddress,
                profilePhoto: updatedProfile.profilePhoto,
                phoneNumber: updatedProfile.phone,
            }
        });
    } catch (error) {
        console.error("Error updating vendor profile:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }


        res.status(500).json({
            success: false,
            message: "Server error while updating user profile",
            error: error.message,
        });
    }
};


export const getUserProfile = async (req, res) => {
    try {
        const vendor = req.vendor
        const profile = await Vendor.findById(vendor).select("-password -googleID");


        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const fetchVendorDashoboard = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        // --- 1. All-time total earnings (all completed bookings) ---
        const allTimeEarnings = await Booking.aggregate([
            { $match: { vendor: new mongoose.Types.ObjectId(vendor), status: "completed" } },
            { $group: { _id: null, totalEarnings: { $sum: "$price" } } },
        ]);

        const totalService = await Service.countDocuments({ vendorID: vendor });

        const totalBookings = await Booking.countDocuments({ vendor: vendor });

        const recentBookings = await Booking.find({ vendor: vendor })
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,
            allTimeEarnings,
            totalService,
            totalBookings,
            recentBookings
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching dashboard data",
            error: error.message,
        });
    }
}


export const addBankDetails = async (req, res) => {
    try {
        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { bankName, accountName, accNumber } = req.body

        // Update vendor bank details
        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendor,
            {
                bankDetails: {
                    bankName,
                    accountName,
                    accNumber, // matches your schema spelling
                },
            },
            { new: true }
        );

        if (!updatedVendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Bank details added successfully",
            data: updatedVendor.bankDetails,
        });
    } catch (error) {
        console.error("Error adding bank details:", error);
        res.status(500).json({
            success: false,
            message: "Server error while adding bank details",
            error: error.message,
        });
    }
};


export const editDriverProfile = async (req, res) => {
    try {

        const { phoneNumber, bio, state, availability, price } = req.body;

        const vendor = req.vendor;
        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits",
            });
        }

        let profile = await Vendor.findById(vendor);

        if (bio !== undefined) {
            profile.carDetails.bio = bio;
        }

        if (phoneNumber !== undefined) {
            profile.phone = phoneNumber;
        }

        if (state !== undefined) {
            let parsedState = state;

            if (typeof state === "string") {
                parsedState = state
                    .split(",")
                    .map(day => day.trim())
                    .filter(day => day !== "");
            }

            profile.carDetails.state = parsedState;
        }

        // ✅ Update price
        if (price !== undefined) {
            vendor.price = price;
        }

        // ✅ Update availability
        if (availability !== undefined) {
            vendor.carDetails.availability = typeof availability === "string"
                ? availability.split(",").map(day => day.trim()).filter(Boolean)
                : availability;
        }

        // Handle profilePhoto upload if a file is provided
        if (req.file) {

            try {
                // Delete old profilePhoto from Cloudinary if it exists
                if (profile.profilePhoto && profile.profilePhoto.publicId) {
                    await cloudinary.uploader.destroy(profile.profilePhoto.publicId);
                }

                // Upload new profilePhoto to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "Meride Haven/profilePhoto",
                    width: 500,
                    height: 500,
                    crop: "fill"
                });

                // Update profilePhoto in profile
                profile.profilePhoto = {
                    publicId: result.public_id,
                    url: result.secure_url
                };
                // Delete the temporary file after successful upload
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (uploadErr) {

                // Clean up the file if upload fails
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    success: false,
                    message: `Failed to upload image: ${uploadErr.message}`
                });
            }
        };

        // Save the updated profile
        const updatedProfile = await profile.save();

        res.status(200).json({
            success: true,
            message: "Driver profile updated successfully",
            data: {
                fullName: updatedProfile.fullName,
                state: updatedProfile.carDetails.state,
                bio: updatedProfile.carDetails.bio,
                profilePhoto: updatedProfile.profilePhoto,
                phoneNumber: updatedProfile.phone,
            }
        });
    } catch (error) {
        console.error("Error updating driver profile:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }


        res.status(500).json({
            success: false,
            message: "Server error while updating user profile",
            error: error.message,
        });
    }
};


export const updatecarDetails = async (req, res) => {
    try {
        const vendorID = req.vendor;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to update services for this vendor",
            });
        }

        const vendor = await Vendor.findById(vendorID);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // ✅ Ensure carDetails exists
        if (!vendor.carDetails) {
            vendor.carDetails = {};
        }

        const filesToCleanup = [];
        const { vehicleDetails } = req.body;



        // ✅ Files in form-data
        const imageFiles = {
            image1: req.files?.image1?.[0],
            image2: req.files?.image2?.[0],
            image3: req.files?.image3?.[0],
        };

        // ✅ Loop through images and update in carDetails
        for (const key of ["image1", "image2", "image3"]) {
            const newImage = imageFiles[key];
            const removeFlag = req.body[`remove_${key}`]; // form: remove_image1 = "true"

            // ✅ Remove image
            if (removeFlag === "true" && vendor.carDetails[key]?.publicId) {
                await cloudinary.uploader.destroy(vendor.carDetails[key].publicId);
                vendor.carDetails[key] = undefined;
                continue;
            }

            // ✅ Upload new image and replace
            if (newImage) {
                const uploadResult = await cloudinary.uploader.upload(newImage.path, {
                    folder: "MerideHaven/serviceImages",
                });

                // Delete local upload
                if (fs.existsSync(newImage.path)) {
                    fs.unlinkSync(newImage.path);
                }

                // ✅ Delete existing Cloudinary image
                if (vendor.carDetails[key]?.publicId) {
                    await cloudinary.uploader.destroy(vendor.carDetails[key].publicId);
                }

                // ✅ Save to DB correctly (THIS WAS MISSING)
                vendor.carDetails[key] = {
                    publicId: uploadResult.public_id,
                    url: uploadResult.secure_url,
                };
            }
        }

        // ✅ Vehicle details
        if (vehicleDetails !== undefined) {
            vendor.carDetails.vehicleDetails = vehicleDetails;
        }

        await vendor.save();

        res.status(200).json({
            message: "Car details updated successfully",
            carDetails: vendor.carDetails,
            price: vendor.price,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating car details",
            error: error.message,
        });
    }
};
