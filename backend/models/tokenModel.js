// models/Token.js
import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Admin"
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["invitation", "email-verification"],
        default: "invitation"
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Token expires after 1 hour
    }
});

// Compound index to prevent multiple active invitation tokens
tokenSchema.index({ adminId: 1, type: 1 }, { unique: true });

const Token = mongoose.model("Token", tokenSchema);
export default Token;