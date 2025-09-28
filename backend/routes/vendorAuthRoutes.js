import express from "express";
import {
    registerVendor,
    verifyVendor,
    login,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    resendResetCode,
    resendVerificationCode,
    handleGoogleLogin,
    googleAuthCallback,
    uploadKyc,
} from "../controllers/vendorAuthController.js";
import multer from "multer";
import { uploadDriverImages } from "../middleware/uploadMiddleware.js";
import {
    driverKyc,
    driverLogin,
    registerDriver,
    requestDriverPasswordReset,
    resendDriverResetCode,
    resendDriverVerificationCode,
    resetDriverPassword,
    verifyDriver,
    verifyDriverResetCode
} from "../controllers/driverAuthController.js";


const vendorAuthRouter = express.Router();


const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for multer


// Registration routes

vendorAuthRouter.post("/register", registerVendor); // Step 2: Register vendor with form data

vendorAuthRouter.post("/verify", verifyVendor); // Step 3: Verify vendor with code

vendorAuthRouter.post("/resend-verification", resendVerificationCode); // Resend verification code


// Login route 
vendorAuthRouter.post("/login", login);


// Password reset routes
vendorAuthRouter.post("/forgot-password", requestPasswordReset); // Stage 1

vendorAuthRouter.post("/verify-reset-code", verifyResetCode);   // Stage 2

vendorAuthRouter.post("/reset-password", resetPassword);        // Stage 3

vendorAuthRouter.post("/resend-reset-code", resendResetCode);   // Resend code


// Google OAuth
vendorAuthRouter.get('/google', handleGoogleLogin);

vendorAuthRouter.get('/google/callback', googleAuthCallback);


vendorAuthRouter.post(
    "/upload",
    upload.fields([
        { name: "cac", maxCount: 1 },
        { name: "directorID", maxCount: 1 },
        { name: "address", maxCount: 1 },
    ]),
    uploadKyc
)


// Driver registration routes
vendorAuthRouter.post("/driver", registerDriver); // Step 2: Register driver with form data

vendorAuthRouter.post("/driver/verify", verifyDriver); // Step 3: Verify driver with code

vendorAuthRouter.post("/driver/resend-verification", resendDriverVerificationCode); // Resend verification code


// Login route 
vendorAuthRouter.post("/driver/login", driverLogin);


// Password reset routes
vendorAuthRouter.post("/driver/forgot-password", requestDriverPasswordReset); // Stage 1

vendorAuthRouter.post("/driver/verify-reset-code", verifyDriverResetCode);   // Stage 2

vendorAuthRouter.post("/driver/reset-password", resetDriverPassword);        // Stage 3

vendorAuthRouter.post("/driver/resend-reset-code", resendDriverResetCode);   // Resend code

vendorAuthRouter.post("/driverkyc", uploadDriverImages, driverKyc); // Step 3: Verify vendor with code


export default vendorAuthRouter;