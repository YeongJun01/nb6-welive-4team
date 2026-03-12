import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { UserController, UserService, UserRepository } from './';
import { ResidentListRepository } from '../residentList/residentList.repository';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

const userService = new UserService(new UserRepository(prisma), new ResidentListRepository(prisma));
const userController = new UserController(userService);

router.use(authMiddleware);
router.route('/me').patch(asyncHandler(userController.updateProfile.bind(userController)));
router.route('/password').patch(asyncHandler(userController.updatePassword.bind(userController)));

export default router;
