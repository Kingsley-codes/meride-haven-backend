import express from "express";
import { approveVendor, fetchPendingVendors, rejectVendor } from "../controllers/vendorprocessingController.js";


const vendorProcessingRouter = express.Router();


// Vendor processing routes

vendorProcessingRouter.get("/", fetchPendingVendors);

vendorProcessingRouter.post("/approve", approveVendor);

vendorProcessingRouter.post("/reject", rejectVendor);

export default vendorProcessingRouter;