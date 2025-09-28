import bcrypt from 'bcrypt';
import { CodeTypes, VendorVerificationCodes } from '../utils/verificationCodes.js';
import { sendVendorPasswordResetEmail, sendVendorVerificationEmail } from '../utils/emailSender.js';
import jwt from "jsonwebtoken";
import validator from 'validator';
import { v2 as cloudinary } from "cloudinary";
import passport from 'passport';
import streamifier from "streamifier";
import fs from 'fs';
import Driver from '../models/driverModel.js';



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



// Driver Registration
export const registerDriver = async (req, res) => {
    try {
        const { driverName, email, password, confirmPassword, phone, city } = req.body;

        // Validations
        if (!driverName || typeof driverName !== 'string') {
            return res.status(400).json({
                status: "fail",
                message: "Driver name must must exist and must be a string"
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

        if (!city || typeof city !== 'string') {
            return res.status(400).json({
                status: "fail",
                message: "City must must exist and must be a string"
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

        if (await Driver.findOne({ email })) {
            return res.status(400).json({
                status: "fail",
                message: "Email already in use"
            });
        }

        await Driver.create({
            email,
            phone,
            driverName,
            city,
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
export const verifyDriver = async (req, res) => {
    try {
        const { verificationCode, email } = req.body;

        if (!VendorVerificationCodes.verifyVerificationCode(email, verificationCode)) {
            return res.status(400).json({ status: "fail", message: "Invalid code" });
        }

        const vendor = await Driver.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        if (!vendor) return res.status(404).json({ status: "fail", message: "Driver not found" });

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
export const resendDriverVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        // // Check if vendor exists
        const vendor = await Driver.findOne({ email });
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
export const driverLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "fail",
                message: "Email and password required"
            });
        }

        const vendor = await Driver.findOne({ email }).select('+password');
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

        const response = {
            status: "success",
            token,
            data: { vendor }
        };

        res.status(200).json(response);

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
export const requestDriverPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ status: "fail", message: "Invalid email" });
        }

        const vendor = await Driver.findOne({ email });
        if (!vendor) {
            return res.status(404).json({ status: "fail", message: "Driver not found" });
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
export const verifyDriverResetCode = async (req, res) => {
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
export const resetDriverPassword = async (req, res) => {
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
        const vendor = await Driver.findOneAndUpdate(
            { email },
            { password: await bcrypt.hash(newPassword, 12) },
            { new: true } // This ensures we get the updated document
        );

        if (!vendor) {
            return res.status(404).json({
                status: "fail",
                message: "Driver not found"
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
export const resendDriverResetCode = async (req, res) => {
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


export const driverKyc = async (req, res) => {
    let filesToCleanup = []; // Track files for cleanup

    try {
        const { vendorId, vehicleOwner, availability, period, experience, vehicleDetails } = req.body;

        if (!req.files || !req.files.passport || !req.files.license || !req.files.address) {
            return res.status(400).json({
                error: "All documents are required"
            });
        }

        if (!availability || (availability !== 'full-time' && availability !== 'part-time')) {
            return res.status(400).json({
                error: "Invalid availability status"
            });
        }

        if (availability === 'part-time' && !period) {
            return res.status(400).json({
                error: "Period is required for part-time availability"
            });
        }

        if (!experience || experience < 0) {
            return res.status(400).json({
                error: "Invalid experience"
            });
        }

        if (!vehicleOwner || (vehicleOwner && !vehicleDetails)) {
            return res.status(400).json({
                error: "Invalid vehicle ownership details"
            });
        }

        const passportFile = req.files.passport[0];
        const licenseFile = req.files.license[0];
        const addressFile = req.files.address[0];


        if (passportFile) {
            filesToCleanup.push(passportFile);
        }

        if (licenseFile) {
            filesToCleanup.push(licenseFile);
        }

        if (addressFile) {
            filesToCleanup.push(addressFile);
        }

        // Upload each document to Cloudinary
        const passportResult = await cloudinary.uploader.upload(
            passportFile.path,
            { folder: "Meride Haven/kyc" }
        );
        const licenseResult = await cloudinary.uploader.upload(
            licenseFile.path,
            { folder: "Meride Haven/kyc" }
        );
        const addressResult = await cloudinary.uploader.upload(
            addressFile.path,
            { folder: "Meride Haven/kyc" }
        );

        const driverVendor = await Driver.findById(vendorId);

        if (!driverVendor) {
            return res.status(404).json({
                error: "Vendor not found"
            });
        }


        driverVendor.vehicleOwner = vehicleOwner;
        driverVendor.availability = availability;
        driverVendor.period = period;
        driverVendor.experience = experience;
        driverVendor.vehicleDetails = vehicleDetails;
        driverVendor.passport = {
            publicId: passportResult.public_id,
            url: passportResult.secure_url
        };
        driverVendor.license = {
            publicId: licenseResult.public_id,
            url: licenseResult.secure_url
        };
        driverVendor.address = {
            publicId: addressResult.public_id,
            url: addressResult.secure_url
        };

        // Delete file immediately after upload
        if (fs.existsSync(passportFile.path)) {
            fs.unlinkSync(passportFile.path);
        }

        if (fs.existsSync(licenseFile.path)) {
            fs.unlinkSync(licenseFile.path);
        }

        if (fs.existsSync(addressFile.path)) {
            fs.unlinkSync(addressFile.path);
        }

        driverVendor.kycuploaded = true;

        await driverVendor.save();

        return res.status(201).json({
            message: "Driver KYC submitted successfully"
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