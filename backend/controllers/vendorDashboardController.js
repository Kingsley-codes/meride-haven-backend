import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";

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

        if (status && ["in progress", "cancelled", "confirmed", "pending", "failed", "completed"].includes(status)) {
            filter.status = status;
        }

        if (servicetype && ["security", "apartment", "car rental", "event", "cruise"].includes(servicetype)) {
            filter.serviceType = servicetype;
        }

        if (q) {
            filter.$or = [
                { clientNumber: { $regex: q, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const bookings = await Booking.find({
            ...filter,
            vendor: vendor,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            bookings,
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

        const client = await User.findOne({ phone: booking.clientNumber });

        if (!client) {
            console.log("User not found for: ", booking.clientNumber);
            throw new Error("User not found");
        }

        client.bookings += 1;
        client.lastBooking = new Date();
        await client.save();

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




export const editProfile = async (req, res) => {
    try {
        const { firstName, lastName, postalCode, address, dob, phoneNumber } = req.body;

        // Find the organization profile for the authenticated user
        let profile = await User.findById(req.user._id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        // Update only the provided fields
        if (firstName !== undefined) {
            profile.firstName = firstName;
        }

        if (lastName !== undefined) {
            profile.lastName = lastName;
        }
        if (postalCode !== undefined) {
            profile.postalCode = postalCode;
        }
        if (address !== undefined) {
            profile.address = address;
        }
        if (dob !== undefined) {
            profile.dob = dob;
        }
        if (phoneNumber !== undefined) {
            profile.phoneNumber = phoneNumber;
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
                    folder: "idonatio/profilePhoto",
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
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                address: updatedProfile.address,
                dob: updatedProfile.dob,
                profilePhoto: updatedProfile.profilePhoto,
                phoneNumber: updatedProfile.phoneNumber,
                postalCode: updatedProfile.postalCode,
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
            message: "Server error while updating organization profile"
        });
    }
};


export const getUserProfile = async (req, res) => {
    try {
        const profile = await User.findById(req.user._id).select("-password");

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
