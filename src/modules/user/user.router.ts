import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { UserController, UserService, UserRepository } from './';
import { ResidentListRepository } from '../residentList/residentList.repository';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

const userService = new UserService(new UserRepository(prisma), new ResidentListRepository(prisma));
const userController = new UserController(userService);

router.route('/signup').post(asyncHandler(userController.signUp.bind(userController)));
router.route('/profile').patch(asyncHandler(userController.updateProfile.bind(userController)));
router.route('/password').patch(asyncHandler(userController.updatePassword.bind(userController)));
router
  .route('/join-status')
  .patch(asyncHandler(userController.updateJoinStatus.bind(userController)));
router
  .route('/rejected')
  .delete(asyncHandler(userController.deleteRejectedUsers.bind(userController)));

export default router;
