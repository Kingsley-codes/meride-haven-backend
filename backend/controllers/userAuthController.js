import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { CodeTypes, UserVerificationCodes } from "../utils/verificationCodes";
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
    const { email, password, confirmPassword, username } = req.body;

    // Validate user input
    if (!email || !password || !confirmPassword || !username) {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    await User.create({
      email,
      password: hashedPassword,
      username,
      isVerified: false,
    });

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
