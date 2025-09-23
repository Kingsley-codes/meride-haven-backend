import express from 'express';
import { getAllServices, getServiceById  } from '../controllers/userServiceController';

const userServiceRouter = express.Router();

userServiceRouter.get('/', getAllServices);
userServiceRouter.get('/:id', getServiceById);

export default userServiceRouter;