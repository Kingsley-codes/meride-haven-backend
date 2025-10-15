import mongoose from "mongoose";

export const bankSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    accNumber: {
        type: String,
        required: true
    }
})