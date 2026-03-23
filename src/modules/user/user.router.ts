import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middlewares';
import { UserController, UserService, UserRepository } from './';
import { ResidentListRepository } from '../residentList/residentList.repository';
import { ResidentListService } from '../residentList/residentList.service';

const router = Router();

const userRepository = new UserRepository(prisma);
const residentListRepository = new ResidentListRepository(prisma);
const residentListService = new ResidentListService(residentListRepository, userRepository);
const userService = new UserService(userRepository, residentListRepository, residentListService);
const userController = new UserController(userService);

router.use(authMiddleware);
router.route('/me').patch(asyncHandler(userController.updateProfile.bind(userController)));
router.route('/password').patch(asyncHandler(userController.updatePassword.bind(userController)));

export default router;
