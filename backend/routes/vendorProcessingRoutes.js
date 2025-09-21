import express from "express";
import { approveVendor, fetchPendingVendors, rejectVendor } from "../controllers/vendorprocessingController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddlewar.js";



const vendorProcessingRouter = express.Router();

// Vendor processing routes

vendorProcessingRouter.get("/pending", adminAuthenticate, fetchPendingVendors);

vendorProcessingRouter.post("/approve", adminAuthenticate, approveVendor);

vendorProcessingRouter.post("/reject", adminAuthenticate, rejectVendor);

export default vendorProcessingRouter;