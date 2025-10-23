import bcrypt from 'bcrypt';
import Vendor from '../models/vendorModel.js';
import { CodeTypes, VendorVerificationCodes } from '../utils/verificationCodes.js';
import { sendVendorPasswordResetEmail, sendVendorVerificationEmail } from '../utils/emailSender.js';
import jwt from "jsonwebtoken";
import validator from 'validator';
import { v2 as cloudinary } from "cloudinary";
import passport from 'passport';
import streamifier from "streamifier";
import fs from "fs";



// Helper function to sign JWT tokens
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Helper function to upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};


// Vendor Registration
export const registerVendor = async (req, res) => {
    try {
        const { businessName, email, password, confirmPassword, phone } = req.body;

        // Validations
        if (!businessName || typeof businessName !== 'string') {
            return res.status(400).json({
                status: "fail",
                message: "Business name must must exist and must be a string"
            });
        }

        if (!phone || !/^\d{11}$/.test(phone)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid email format"
            });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        })) {
            return res.status(400).json({
                status: "fail",
                message: "Password must be at least 8 characters and include an uppercase letter, number, and symbol"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                status: "fail",
                message: "Passwords don't match"
            });
        }

        if (await Vendor.findOne({ email })) {
            return res.status(400).json({
                status: "fail",
                message: "Email already in use"
            });
        }

        await Vendor.create({
            businessName,
            email,
            phone,
            password: await bcrypt.hash(password, 12),
            isVerified: true
        });

        // const verificationCode = VendorVerificationCodes.generateVerificationCode(email);
        // await sendVendorVerificationEmail(email, verificationCode, false);

        res.status(200).json({
            status: "success",
            message: "Verification code sent",
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Registration failed",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};



// Email Verification
export const verifyVendor = async (req, res) => {
    try {
        const { verificationCode, email } = req.body;

        if (!VendorVerificationCodes.verifyVerificationCode(email, verificationCode)) {
            return res.status(400).json({ status: "fail", message: "Invalid code" });
        }

        const vendor = await Vendor.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        if (!vendor) return res.status(404).json({ status: "fail", message: "Vendor not found" });

        const token = signToken(vendor._id);
        vendor.password = undefined;

        VendorVerificationCodes.clearCode(email, 'verification');

        res.status(200).json({
            status: "success",
            token,
            data: { vendor }
        });
    } catch (err) {
        console.error("Verification error:", err);
        if (err.name === 'MongoError') {
            return res.status(500).json({
                status: "error",
                message: "Database error during verification",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Account verification failed",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};



// Resend Verification Code
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        // // Check if vendor exists
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(404).json({
                status: "fail",
                message: "Vendor not found"
            });
        }

        // Check if vendor is already verified
        if (vendor.isVerified) {
            return res.status(400).json({
                status: "fail",
                message: "Vendor is already verified"
            });
        }

        // Check resend limitations (implement this in your VerificationCodes utility)
        const resendStatus = VendorVerificationCodes.canResendCode(email, CodeTypes.VERIFICATION);

        if (!resendStatus.canResend) {
            return res.status(429).json({
                status: "fail",
                message: resendStatus.message || "Please wait before requesting a new code"
            });
        }

        // Generate and send new code
        const newCode = VendorVerificationCodes.resendVerificationCode(email);
        await sendVendorVerificationEmail(email, newCode, true);

        res.status(200).json({
            status: "success",
            message: "New verification code sent",
        });


    } catch (err) {

        if (err.name === 'EmailError') {
            return res.status(500).json({
                status: "error",
                message: "Failed to send verification email",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to resend verification code",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });

    }
};



// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "fail",
                message: "Email and password required"
            });
        }

        const vendor = await Vendor.findOne({ email }).select('+password');
        if (!vendor || !(await bcrypt.compare(password, vendor.password))) {
            return res.status(401).json({
                status: "fail",
                message: "Invalid credentials"
            });
        }

        if (!vendor.isVerified) {
            return res.status(401).json({
                status: "fail",
                message: "Account not verified"
            });
        }

        const token = signToken(vendor._id);
        vendor.password = undefined;

        if (vendor.approvedStatus === 'rejected') {
            if (vendor.declineReason !== "seems illegitimate") {
                res.status(200).json({
                    status: "partial",
                    message: "please re-upload your kyc documents",
                    token,
                    data: { vendor }
                });
            } else {
                return res.status(401).json({
                    status: "fail",
                    message: "Account not authorized to use this patform"
                });
            }

        } else {
            res.status(200).json({
                status: "success",
                token,
                data: { vendor }
            });
        }

    } catch (err) {
        console.error('Login error:', err);
        if (err.name === 'TokenError') {
            return res.status(500).json({
                status: "error",
                message: "Failed to generate authentication token",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Login failed due to server error",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


// Password Reset - Stage 1: Request Reset
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ status: "fail", message: "Invalid email" });
        }

        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(404).json({ status: "fail", message: "Vendor not found" });
        }

        const code = VendorVerificationCodes.generateResetCode(email);
        await sendVendorPasswordResetEmail(email, code);

        res.status(200).json({
            status: "success",
            message: "Reset code sent"
        });
    } catch (err) {
        console.error("Reset request error:", err);
        if (err.name === 'EmailError') {
            return res.status(500).json({
                status: "error",
                message: "Failed to send password reset email",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Password reset request failed",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


// Password Reset - Stage 2: Verify Code
export const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const verification = VendorVerificationCodes.verifyResetCode(email, code);

        if (!verification.valid) {
            return res.status(400).json({
                status: "fail",
                message: verification.message
            });
        }

        res.status(200).json({
            status: "success",
            message: "Code verified",
        });
    } catch (err) {
        console.error("Code verify error:", err);
        res.status(500).json({
            status: "error",
            message: "Reset code verification failed",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


// Password Reset - Stage 3: Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: "fail",
                message: "Passwords don't match"
            });
        }

        // Validate password strength
        if (!validator.isStrongPassword(newPassword, {
            minLength: 8,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        })) {
            return res.status(400).json({
                status: "fail",
                message: "Password must be at least 8 characters and include an uppercase letter, number, and symbol"
            });
        }

        // Update the vendor and get the updated document
        const vendor = await Vendor.findOneAndUpdate(
            { email },
            { password: await bcrypt.hash(newPassword, 12) },
            { new: true } // This ensures we get the updated document
        );

        if (!vendor) {
            return res.status(404).json({
                status: "fail",
                message: "Vendor not found"
            });
        }

        VendorVerificationCodes.clearCode(email, 'password_reset');

        const token = signToken(vendor._id);

        res.status(200).json({
            status: "success",
            message: "Password updated successfully",
            token,
            data: {
                id: vendor._id,
                email: vendor.email
            }
        });
    } catch (err) {
        console.error("Password reset error:", err);
        if (err.name === 'BcryptError') {
            return res.status(500).json({
                status: "error",
                message: "Password encryption failed",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Password reset failed",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


// Resend Reset Code
export const resendResetCode = async (req, res) => {
    try {
        const { email } = req.body;

        const resendStatus = VendorVerificationCodes.canResendCode(email, CodeTypes.PASSWORD_RESET);

        if (!resendStatus.canResend) {
            return res.status(429).json({
                status: "fail",
                message: resendStatus.message
            });
        }
        const newCode = VendorVerificationCodes.resendResetCode(email);

        await sendVendorPasswordResetEmail(email, newCode);

        res.status(200).json({
            status: "success",
            message: "New code sent"
        });
    } catch (err) {
        console.error("Resend error:", err);
        if (err.name === 'EmailError') {
            return res.status(500).json({
                status: "error",
                message: "Failed to send password reset email",
                details: err.message
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to resend password reset code",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


export const handleGoogleLogin = (req, res, next) => {
    passport.authenticate('google-vendor', {
        scope: ['profile', 'email'],
        session: false,
    })(req, res, next);
};


export const googleAuthCallback = (req, res) => {
    passport.authenticate(
        'google-vendor',
        {
            session: false, failureRedirect: `${process.env.FRONTEND_URL}/login`
        },
        (err, vendor) => {
            if (err || !vendor) {
                return res.redirect(`${process.env.FRONTEND_URL}/vendors/login`);
            }

            const token = signToken(vendor._id);

            if (process.env.FRONTEND_URL) {
                const redirectUrl = `${process.env.FRONTEND_URL}/vendors/?token=${token}`;
                return res.redirect(redirectUrl);
            }

            return res.json({ token });
        }
    )(req, res);
};



// Upload KYC documents
export const uploadKyc = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!req.files || !req.files.cac || !req.files.directorID || !req.files.address) {
            return res.status(400).json({
                error: "All documents are required"
            });
        }

        // Upload each document to Cloudinary
        const cacResult = await uploadToCloudinary(
            req.files.cac[0].buffer,
            "Meride Haven/kyc"
        );
        const directorsIdResult = await uploadToCloudinary(
            req.files.directorID[0].buffer,
            "Meride Haven/kyc"
        );
        const addressProofResult = await uploadToCloudinary(
            req.files.address[0].buffer,
            "Meride Haven/kyc"
        );

        const kycVendor = await Vendor.findById(userId);

        if (!kycVendor) {
            return res.status(404).json({
                error: "Vendor not found"
            });
        }

        if (kycVendor.kycuploaded && kycVendor.approvedStatus === 'approved') {
            return res.status(400).json({
                error: "KYC already approved"
            });
        }

        kycVendor.cac = {
            publicId: cacResult.public_id,
            url: cacResult.secure_url
        };
        kycVendor.directorID = {
            publicId: directorsIdResult.public_id,
            url: directorsIdResult.secure_url
        };
        kycVendor.address = {
            publicId: addressProofResult.public_id,
            url: addressProofResult.secure_url
        };

        kycVendor.kycuploaded = true;
        kycVendor.approvedStatus = 'pending';

        await kycVendor.save();

        return res.status(201).json({
            message: "KYC submitted successfully",
        });
    } catch (err) {
        console.error("KYC upload error:", err);
        return res.status(500).json({ error: "Server error" });
    }
};


// Driver Registration
export const registerDriver = async (req, res) => {
    try {
        const { vendorName, email, password, confirmPassword, state, phone } = req.body;

        // Validations
        if (!vendorName || typeof vendorName !== 'string') {
            return res.status(400).json({
                status: "fail",
                message: "Business name must must exist and must be a string"
            });
        }

        if (!state) {
            return res.status(400).json({
                status: "fail",
                message: "You must add your state"
            });
        }

        if (!phone || !/^\d{11}$/.test(phone)) {
            return res.status(400).json({
                status: "fail",
                message: "Phone number must be exactly 11 digits"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid email format"
            });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        })) {
            return res.status(400).json({
                status: "fail",
                message: "Password must be at least 8 characters and include an uppercase letter, number, and symbol"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                status: "fail",
                message: "Passwords don't match"
            });
        }

        if (await Vendor.findOne({ email })) {
            return res.status(400).json({
                status: "fail",
                message: "Email already in use"
            });
        }

        let parsedState = state;

        if (typeof state === "string") {
            parsedState = state
                .split(",")
                .map(day => day.trim())
                .filter(day => day !== "");
        }

        await Vendor.create({
            vendorName,
            email,
            phone,
            VendorType: "driver",
            carDetails: {
                state: parsedState
            },
            password: await bcrypt.hash(password, 12),
        });

        const verificationCode = VendorVerificationCodes.generateVerificationCode(email);
        await sendVendorVerificationEmail(email, verificationCode, false);

        res.status(200).json({
            status: "success",
            message: "Verification code sent",
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Registration failed",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};



export const driverKyc = async (req, res) => {
    let filesToCleanup = [];

    try {
        const { vendorId, vehicleOwner, bio, availability, price, experience, vehicleDetails } = req.body;

        const profilePhotoFile = req.files?.profilePhoto?.[0];


        // ✅ Find vendor
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        // ✅ Validate initial KYC only if no previous KYC exists
        const isFirstSubmission = !vendor.kycuploaded;
        if (isFirstSubmission) {
            if (!req.files?.passport || !req.files?.license || !req.files?.address) {
                return res.status(400).json({ error: "All documents must be uploaded for first KYC" });
            }
        }

        // ✅ Optional: format availability
        let parsedAvailability = availability;
        if (typeof availability === "string") {
            parsedAvailability = availability.split(",").map(day => day.trim()).filter(Boolean);
        }

        // ✅ Update non-image fields only if provided
        if (vehicleOwner !== undefined) vendor.carDetails.vehicleOwner = vehicleOwner;
        if (bio !== undefined) vendor.carDetails.bio = bio;
        if (parsedAvailability) vendor.carDetails.availability = parsedAvailability;
        if (experience !== undefined) vendor.carDetails.experience = experience;
        if (vehicleDetails !== undefined) vendor.carDetails.vehicleDetails = vehicleDetails;
        if (price !== undefined) vendor.price = price;

        if (profilePhotoFile) {
            try {
                const driverPhotoResult = await cloudinary.uploader.upload(profilePhotoFile.path, {
                    folder: 'MerideHaven/profilePhoto'
                });

                // Delete old driver photo
                if (vendor.profilePhoto?.publicId) {
                    try {
                        await cloudinary.uploader.destroy(vendor.profilePhoto.publicId);
                    } catch (error) {
                        console.error("Error deleting old driver photo:", error);
                    }
                }

                vendor.profilePhoto = {
                    publicId: driverPhotoResult.public_id,
                    url: driverPhotoResult.secure_url
                };
            } finally {
                if (fs.existsSync(profilePhotoFile.path)) {
                    fs.unlinkSync(profilePhotoFile.path);
                }
            }
        }

        // ✅ Function to delete old Cloudinary image before saving the new one
        const replaceCloudinaryImage = async (newFile, oldImage, fieldName) => {
            if (newFile) {
                if (oldImage?.publicId) {
                    try {
                        await cloudinary.uploader.destroy(oldImage.publicId); // ✅ Delete old one from Cloudinary
                    } catch (err) {
                        console.error(`Failed to delete old ${fieldName} image:`, err.message);
                    }
                }
                const uploaded = await cloudinary.uploader.upload(newFile.path, { folder: "Meride Haven/kyc" });
                filesToCleanup.push(newFile); // temp cleanup
                return { publicId: uploaded.public_id, url: uploaded.secure_url };
            }
            return oldImage;
        };

        // ✅ If new file uploaded → update it (and delete old one)
        vendor.passport = await replaceCloudinaryImage(req.files?.passport?.[0], vendor.passport, "passport");
        vendor.license = await replaceCloudinaryImage(req.files?.license?.[0], vendor.license, "license");
        vendor.address = await replaceCloudinaryImage(req.files?.address?.[0], vendor.address, "address");

        vendor.kycuploaded = true;
        vendor.approvedStatus = 'pending';
        await vendor.save();

        // ✅ Clean up local temp files
        filesToCleanup.forEach(file => {
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });

        res.status(200).json({
            message: isFirstSubmission ? "Driver KYC submitted successfully" : "Driver KYC updated successfully",
            vendor
        });

    } catch (error) {
        // ❌ Cleanup any leftover uploaded temp files
        filesToCleanup.forEach(file => {
            if (file?.path && fs.existsSync(file.path)) {
                try { fs.unlinkSync(file.path); } catch { }
            }
        });

        res.status(500).json({
            message: "Error processing KYC",
            error: error.message
        });
    }
};
