import express from "express";
import {
  registerUser,
  verifyUser,
  login,
  // requestPasswordReset,
  // verifyResetCode,
  // resetPassword,
  // resendResetCode,
  resendVerificationCode,
} from "../controllers/userAuthController.js";

const userAuthRouter = express.Router();

// User Registration routes
userAuthRouter.post("/register", registerUser); // Step 2: Register user with form data

userAuthRouter.post("/verify", verifyUser); // Step 3: Verify user with code

userAuthRouter.post("/resend-verification", resendVerificationCode); // Resend verification code

// User Login route
userAuthRouter.post("/login", login);

// Password reset routes
// userAuthRouter.post('/forgot-password', requestPasswordReset); // Stage 1

// userAuthRouter.post('/verify-reset-code', verifyResetCode);   // Stage 2

// userAuthRouter.post('/reset-password', resetPassword);        // Stage 3

// userAuthRouter.post('/resend-reset-code', resendResetCode);   // Resend code

export default userAuthRouter;
