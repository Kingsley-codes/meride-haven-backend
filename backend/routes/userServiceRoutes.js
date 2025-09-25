import express from 'express';
import { getServices, getServiceById  } from '../controllers/userServiceController.js';


const userServiceRouter = express.Router();

userServiceRouter.get('/', getServices);
// userServiceRouter.get('/filter', getServicesByType);
// userServiceRouter.get('/search', searchServices);
userServiceRouter.get('/:id', getServiceById);


export default userServiceRouter;