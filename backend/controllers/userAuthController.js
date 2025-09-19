import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { CodeTypes, UserVerificationCodes } from "../utils/verificationCodes.js";
import {
  sendUserPasswordResetEmail,
  sendUserVerificationEmail,
} from "../utils/emailSender.js";
import jwt from "jsonwebtoken";
import validator from "validator";

// Helper function to sign JWT tokens for User
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { email, password, confirmPassword, phone, fullName } = req.body;

    // Validate user input
    if (!email || !password || !confirmPassword || !fullName || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({
        status: "fail",
        message:
          "Password must be at least 8 characters and include an uppercase letter, number, and symbol",
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email format",
      });
    }
    // Validate phone number format
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        status: "fail",
        message: "Phone number must be exactly 11 digits"
      });
    }

    // Validate full name
    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({
        status: "fail",
        message: "Full name must be at least 3 characters long"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        status: "fail",
        message: "User is already registered and verified",
      });

    } else if (existingUser && !existingUser.isVerified) {
      if (
        existingUser.fullName !== fullName ||
        existingUser.phone !== phone
      ) {
        existingUser.fullName = fullName;
        existingUser.phone = phone;
        existingUser.password = hashedPassword;
      }

      await existingUser.save();
    } else {
      // Create new user
      await User.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        isVerified: false,
      });
    }

    // Send verification email
    const verificationCode =
      UserVerificationCodes.generateVerificationCode(email);
    await sendUserVerificationEmail(email, verificationCode, false);

    // Respond with success
    res.status(201).json({
      status: "success",
      message: "Verification code sent to your email",
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({
      status: "error",
      message: "Registration failed",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// User Email Verification
export const verifyUser = async (req, res) => {
  try {
    const { verificationCode, email } = req.body;

    if (
      !UserVerificationCodes.verifyVerificationCode(email, verificationCode)
    ) {
      return res.status(400).json({ status: "fail", message: "Invalid code" });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    const token = signToken(user._id);
    user.password = undefined;

    UserVerificationCodes.clearCode(email, "verification");

    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (err) {
    console.error("Verification error:", err);
    if (err.name === "MongoError") {
      return res.status(500).json({
        status: "error",
        message: "Database error during verification",
        details: err.message,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Account verification failed",
      details: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};


// USer Resend Verification Code
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    // // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found"
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        status: "fail",
        message: "User is already verified"
      });
    }

    // Check resend limitations (implement this in your VerificationCodes utility)
    const resendStatus = UserVerificationCodes.canResendCode(email, CodeTypes.VERIFICATION);

    if (!resendStatus.canResend) {
      return res.status(429).json({
        status: "fail",
        message: resendStatus.message || "Please wait before requesting a new code"
      });
    }

    // Generate and send new code
    const newCode = UserVerificationCodes.resendVerificationCode(email);
    await sendUserVerificationEmail(email, newCode, true);

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


// User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials"
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        status: "fail",
        message: "Account not verified"
      });
    }


    const token = signToken(user._id);
    user.password = undefined;

    const response = {
      status: "success",
      token,
      data: { user }
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

