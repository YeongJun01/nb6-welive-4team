import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middlewares';
import { UserController, UserService, UserRepository } from './';
import { ResidentListRepository } from '../residentList/residentList.repository';

const router = Router();

const userService = new UserService(new UserRepository(prisma), new ResidentListRepository(prisma));
const userController = new UserController(userService);

router.use(authMiddleware);
router.route('/me').patch(asyncHandler(userController.updateProfile.bind(userController)));
router.route('/password').patch(asyncHandler(userController.updatePassword.bind(userController)));

export default router;
