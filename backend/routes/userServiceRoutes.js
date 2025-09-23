import express from 'express';
import { getAllServices, getServiceById, getServicesByType, searchServices  } from '../controllers/userServiceController.js';


const userServiceRouter = express.Router();

userServiceRouter.get('/', getAllServices);
userServiceRouter.get('/:id', getServiceById);
userServiceRouter.get('/filter', getServicesByType);
userServiceRouter.get('/search', searchServices);

export default userServiceRouter;