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
} from "../controllers/vendorAuthController.js";

const vendorAuthRouter = express.Router();

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
userAuthRouter.get('/google', handleGoogleLogin);

userAuthRouter.get('/google/callback', googleAuthCallback);

export default vendorAuthRouter;