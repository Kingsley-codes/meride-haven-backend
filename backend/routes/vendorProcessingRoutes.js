import express from "express";
import { activateVendor, approveService, approveVendor, declineService, fetchAllServices, fetchAllVendors, rejectVendor, suspendVendor } from "../controllers/vendorprocessingController.js";
import { adminAuthenticate } from "../middleware/authenticationMiddlewar.js";



const vendorProcessingRouter = express.Router();

// Vendor processing routes

vendorProcessingRouter.get("/pending", adminAuthenticate, fetchAllVendors);
vendorProcessingRouter.post("/approve", adminAuthenticate, approveVendor);
vendorProcessingRouter.post("/reject", adminAuthenticate, rejectVendor);
vendorProcessingRouter.post("/suspend", adminAuthenticate, suspendVendor);
vendorProcessingRouter.post("/activate", adminAuthenticate, activateVendor);


vendorProcessingRouter.post("/services/decline", adminAuthenticate, declineService);
vendorProcessingRouter.get("/services", adminAuthenticate, fetchAllServices);
vendorProcessingRouter.post("/services/approve", adminAuthenticate, approveService);

export default vendorProcessingRouter;