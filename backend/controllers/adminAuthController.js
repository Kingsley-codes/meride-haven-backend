import passport from "passport";
import Admin from "../models/adminModel.js";
import { sendUserPasswordResetEmail } from "../utils/emailSender.js";
import { UserVerificationCodes, CodeTypes } from "../utils/verificationCodes.js";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";



// Helper function to sign JWT tokens for User
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


// Admin Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "fail",
                message: "Email and password required"
            });
        }

        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({
                status: "fail",
                message: "Invalid credentials"
            });
        }


        const token = signToken(admin._id);
        admin.password = undefined;

        const response = {
            status: "success",
            token,
            data: { admin }
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


// Password Reset for User - Stage 1: Request Reset
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ status: "fail", message: "Invalid email" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ status: "fail", message: "Admin Email not found" });
        }

        const code = UserVerificationCodes.generateResetCode(email);
        await sendUserPasswordResetEmail(email, code);

        res.status(200).json({
            status: "success",
            message: "Reset code sent to your email"
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
        const verification = UserVerificationCodes.verifyResetCode(email, code);

        if (!verification.valid) {
            return res.status(400).json({
                status: "fail:::",
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

        // Update the admin and get the updated document
        const admin = await Admin.findOneAndUpdate(
            { email },
            { password: await bcrypt.hash(newPassword, 12) },
            { new: true } // This ensures we get the updated document
        );

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        UserVerificationCodes.clearCode(email, 'password_reset');

        const token = signToken(user._id);

        res.status(200).json({
            status: "success",
            message: "Password updated successfully",
            token,
            data: {
                id: user._id,
                email: user.email
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


// Resend User Reset Code
export const resendResetCode = async (req, res) => {
    try {
        const { email } = req.body;

        const resendStatus = UserVerificationCodes.canResendCode(email, CodeTypes.PASSWORD_RESET);

        if (!resendStatus.canResend) {
            return res.status(429).json({
                status: "fail",
                message: resendStatus.message
            });
        }
        const newCode = UserVerificationCodes.resendResetCode(email);

        await sendUserPasswordResetEmail(email, newCode);

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
    passport.authenticate('google-admin', {
        scope: ['profile', 'email'],
        session: false,
    })(req, res, next);
};


export const googleAuthCallback = (req, res) => {
    passport.authenticate(
        'google-admin',
        {
            session: false, failureRedirect: `${process.env.FRONTEND_URL}/login`
        },
        (err, admin) => {
            if (err || !admin) {
                return res.redirect(`${process.env.FRONTEND_URL}/login`);
            }

            const token = signToken(admin._id);

            if (process.env.FRONTEND_URL) {
                const redirectUrl = `${process.env.FRONTEND_URL}/?token=${token}`;
                return res.redirect(redirectUrl);
            }

            return res.json({ token });
        }
    )(req, res);
};
