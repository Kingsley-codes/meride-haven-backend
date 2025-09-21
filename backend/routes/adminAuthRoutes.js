import express from "express";
import {

    login,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    resendResetCode,
    handleGoogleLogin,
    googleAuthCallback,
} from "../controllers/adminAuthController.js";


const adminAuthRouter = express.Router();


// Login route 
adminAuthRouter.post("/login", login);


// Password reset routes
adminAuthRouter.post("/forgot-password", requestPasswordReset); // Stage 1

adminAuthRouter.post("/verify-reset-code", verifyResetCode);   // Stage 2

adminAuthRouter.post("/reset-password", resetPassword);        // Stage 3

adminAuthRouter.post("/resend-reset-code", resendResetCode);   // Resend code


// Google OAuth
adminAuthRouter.get('/google', handleGoogleLogin);

adminAuthRouter.get('/google/callback', googleAuthCallback);


export default adminAuthRouter;