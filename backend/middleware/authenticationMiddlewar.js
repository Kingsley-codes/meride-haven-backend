import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import Vendor from "../models/vendorModel.js";

// Protection Middleware
export const userAuthenticate = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "Not authorized, no token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) throw new Error("User not found");

        req.user = currentUser;
        next();
    } catch (err) {
        console.error("Protect error:", err);
        const message = err.name === "JsonWebTokenError" ? "Invalid token"
            : err.name === "TokenExpiredError" ? "Session expired"
                : err.message;

        res.status(401).json({
            status: "fail",
            message
        });
    }
};


export const vendorAuthenticate = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "Not authorized, no token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await Vendor.findById(decoded.id);
        if (!currentUser) throw new Error("Vendor not found");

        req.vendor = currentUser;
        next();
    } catch (err) {
        console.error("Protect error:", err);
        const message = err.name === "JsonWebTokenError" ? "Invalid token"
            : err.name === "TokenExpiredError" ? "Session expired"
                : err.message;

        res.status(401).json({
            status: "fail",
            message
        });
    }
};


export const adminAuthenticate = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "Not authorized, no token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await Admin.findById(decoded.id);
        if (!currentUser) throw new Error("Admin not found");

        req.admin = currentUser;
        next();
    } catch (err) {
        console.error("Protect error:", err);
        const message = err.name === "JsonWebTokenError" ? "Invalid token"
            : err.name === "TokenExpiredError" ? "Session expired"
                : err.message;

        res.status(401).json({
            status: "fail",
            message
        });
    }
};