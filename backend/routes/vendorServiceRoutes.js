import express from 'express';
import {
    createService,
    getVendorServices,
    deleteService,
    updateService
} from '../controllers/vendorServiceController.js';
import { vendorAuthenticate } from '../middleware/authenticationMiddlewar.js';
import { uploadServiceImages } from '../middleware/uploadMiddleware.js';

const vendorServiceRouter = express.Router();

vendorServiceRouter.post('/add', vendorAuthenticate, uploadServiceImages, createService);
vendorServiceRouter.get('/', vendorAuthenticate, getVendorServices);
vendorServiceRouter.patch('/update', vendorAuthenticate, updateService);
vendorServiceRouter.delete('/delete', vendorAuthenticate, deleteService);

export default vendorServiceRouter;