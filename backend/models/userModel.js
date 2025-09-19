import mongoose from "mongoose";
import validator from "validator";


const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      validate: {
        validator: (value) => validator.isMobilePhone(value, "any"),
        message: "Invalid phone number format",
      },
    },
    googleID: {
      type: String,
      sparse: true,
    },
    password: {
      type: String,
      // Make password required only for non-Google signups
      required: function () {
        return !this.googleID; // Required if googleID is not present
      },
      minlength: 8,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
