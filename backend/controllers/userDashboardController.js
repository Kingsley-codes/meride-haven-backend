import Booking from "../models/bookingModel.js";
import Service from "../models/serviceModel.js";
import User from "../models/userModel.js";
import Vendor from "../models/vendorModel.js";
import { sendUserUpdateEmail } from "../utils/emailSender.js";
import { UserVerificationCodes } from "../utils/verificationCodes.js";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';




// export const getUserActiveBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const activeBookings = await Booking.find({ user: userId, status: "in progress" });
//         res.status(200).json(activeBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching active bookings", error });
//     }
// };

// export const getUserCompletedBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const completedBookings = await Booking.find({ user: userId, status: "completed" });
//         res.status(200).json(completedBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching completed bookings", error });
//     }
// };

// export const getUserCancelledBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const cancelledBookings = await Booking.find({ user: userId, status: "cancelled" });
//         res.status(200).json(cancelledBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching cancelled bookings", error });
//     }
// };

// export const getUserConfirmedBookings = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const cancelledBookings = await Booking.find({ user: userId, status: "future" });
//         res.status(200).json(cancelledBookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching future bookings", error });
//     }
// };


export const fetchAllBookings = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        const { status } = req.query;

        // Base filter 
        const filter = {};

        if (status && ["in progress", "cancelled", "confirmed", "completed"].includes(status)) {
            filter.status = status;
        }


        const bookings = await Booking.find({
            ...filter,
            client: user,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            bookings,
            totalFiltered: bookings.length
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


export const cancelBooking = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
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


        if (existingBooking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        if (existingBooking.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "You cannot cancel a completed booking",
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


export const completeBooking = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
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



export const bookingRatingController = async (req, res) => {
    try {
        const { rating, reviewDescription, bookingID } = req.body;

        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (!bookingID) {
            return res.status(404).json({
                success: false,
                message: "Booking ID required",
            });
        }

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a number between 1 and 5",
            });
        }

        // Find the booking
        const booking = await Booking.findOne({
            bookingID: bookingID,
            client: user
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.rating) {
            return res.status(404).json({
                success: false,
                message: "You already rated this booking",
            });
        }

        if (booking.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can only rate a completed booking",
            });
        }

        // Save rating and review on the booking
        booking.rating = rating;
        booking.reviewDescription = reviewDescription;
        await booking.save();

        const serviceId = booking.service;
        const vendorId = booking.vendor;

        // Calculate new average rating for the service
        const serviceBookings = await Booking.find({
            service: serviceId,
            rating: { $exists: true },
        });

        const serviceAverage =
            serviceBookings.reduce((acc, b) => acc + b.rating, 0) /
            serviceBookings.length;

        await Service.findByIdAndUpdate(serviceId, {
            rating: serviceAverage.toFixed(1),
        });

        // Calculate vendor average rating (based on all their bookings)
        const vendorBookings = await Booking.find({
            vendor: vendorId,
            rating: { $exists: true },
        });

        const vendorAverage =
            vendorBookings.reduce((acc, b) => acc + b.rating, 0) /
            vendorBookings.length;

        await Vendor.findByIdAndUpdate(vendorId, {
            rating: vendorAverage.toFixed(1),
        });

        return res.status(200).json({
            success: true,
            message: "Rating and review saved successfully",
            data: {
                booking,
                serviceRating: serviceAverage.toFixed(1),
                vendorRating: vendorAverage.toFixed(1),
            },
        });
    } catch (error) {
        console.error("Error in bookingRatingController:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};


export const editProfileRequest = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        let profile = await User.findById(user);

        const userEmail = profile.email;

        // Send verification email
        const verificationCode =
            UserVerificationCodes.generateVerificationCode(userEmail);
        await sendUserUpdateEmail(userEmail, verificationCode, false);

        // Respond with success
        res.status(201).json({
            status: "success",
            message: "Verification code sent to your email",
        });

    } catch (error) {

    }
};



export const resendEditRequest = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        let profile = await User.findById(user);

        const userEmail = profile.email;

        // Check resend limitations (implement this in your VerificationCodes utility)
        const resendStatus = UserVerificationCodes.canResendCode(userEmail, CodeTypes.VERIFICATION);

        if (!resendStatus.canResend) {
            return res.status(429).json({
                status: "fail",
                message: resendStatus.message || "Please wait before requesting a new code"
            });
        }

        // Generate and send new code
        const newCode = UserVerificationCodes.resendVerificationCode(userEmail);
        await sendUserVerificationEmail(userEmail, newCode, true);

        res.status(200).json({
            status: "success",
            message: "New verification code sent",
        });

    } catch (error) {

    }
}


export const editProfile = async (req, res) => {
    try {

        const { verificationCode, fullName, gender, address, phoneNumber } = req.body;

        const user = req.user;
        if (!user) {
            return res.status(403).json({
                success: false,
                message: "You are Unauthorized",
            });
        }

        if (!verificationCode) {
            return res.status(400).json({
                status: "fail",
                message: "Verification code required"
            });
        }

        if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits",
            });
        }

        let profile = await User.findById(user);

        const userEmail = profile.email;

        if (!UserVerificationCodes.verifyVerificationCode(userEmail, verificationCode)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid code"
            });
        }

        // Update only the provided fields
        if (fullName !== undefined) {
            profile.fullName = fullName;
        }

        if (gender !== undefined) {
            profile.gender = gender;
        }
        if (address !== undefined) {
            profile.address = address;
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
            message: "Organization profile updated successfully",
            data: {
                fullName: updatedProfile.fullName,
                address: updatedProfile.address,
                profilePhoto: updatedProfile.profilePhoto,
                phoneNumber: updatedProfile.phone,
                gender: updatedProfile.gender,
            }
        });
    } catch (error) {
        console.error("Error updating organization profile:", error);

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
        const profile = await User.findById(req.user).select("-password -googleID");

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
