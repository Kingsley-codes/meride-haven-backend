import express from "express";
import { approveService, approveVendor, declineService, fetchAllServices, fetchAllVendors, rejectVendor } from "../controllers/vendorprocessingController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddlewar.js";



const vendorProcessingRouter = express.Router();

// Vendor processing routes

vendorProcessingRouter.get("/pending", adminAuthenticate, fetchAllVendors);
vendorProcessingRouter.get("/services", adminAuthenticate, fetchAllServices);

vendorProcessingRouter.post("/approve", adminAuthenticate, approveVendor);
vendorProcessingRouter.post("/services/approve", adminAuthenticate, approveService);

vendorProcessingRouter.post("/reject", adminAuthenticate, rejectVendor);
vendorProcessingRouter.post("/services/decline", adminAuthenticate, declineService);

export default vendorProcessingRouter;