import mongoose from "mongoose";
import validator from "validator";

<<<<<<< HEAD
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: "Invalid email format"
        }
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isMobilePhone,
            message: "Invalid phone number format"
        }
    },
    googleID: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        // Make password required only for non-Google signups
        required: function () {
            return !this.googleID; // Required if googleID is not present
        },
        minlength: 8
    },
    isVerified: {
        type: Boolean,
        default: false
    },

},
    { timestamps: true }
);


=======
const userSchema = new mongoose.Schema(
  {
    username: {
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
    // phone: {
    //   type: String,
    //   required: true,
    //   trim: true,
    //   validate: {
    //     validator: validator.isMobilePhone,
    //     message: "Invalid phone number format",
    //   },
    // },
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

>>>>>>> dae97ea96871b792756291af7431fd6f615e2967
const User = mongoose.model("User", userSchema);

export default User;
