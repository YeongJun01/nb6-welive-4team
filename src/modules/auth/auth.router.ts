import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { UserController } from '../user/user.controller';
import { UserRepository } from '../user/user.repository';
import { ResidentListRepository } from '../residentList/residentList.repository';

const router = Router();

const userRepository = new UserRepository(prisma);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);
const userService = new UserService(userRepository, new ResidentListRepository(prisma));
const userController = new UserController(userService);

// Public routes (인증 불필요)
router.route('/login').post(asyncHandler(authController.login.bind(authController)));
router.route('/refresh').post(asyncHandler(authController.refresh.bind(authController)));
router.route('/logout').post(asyncHandler(authController.logout.bind(authController)));
router.route('/signup').post(asyncHandler(userController.signUpUser.bind(userController)));
router.route('/signup/admin').post(asyncHandler(userController.signUpAdmin.bind(userController)));
router.route('/signup/super-admin').post(asyncHandler(userController.signUpSuperAdmin.bind(userController)));

// Protected routes (인증 필요)
router.use(authMiddleware);

// 정적 경로(/admins/status)를 동적 경로(/admins/:adminId) 보다 먼저 등록
router.route('/admins/status').patch(asyncHandler(userController.updateAdminStatusBulk.bind(userController)));
router.route('/admins/:adminId/status').patch(asyncHandler(userController.updateAdminStatus.bind(userController)));
router.route('/admins/:adminId').patch(asyncHandler(userController.updateAdminInfo.bind(userController)));
router.route('/admins/:adminId').delete(asyncHandler(userController.deleteAdmin.bind(userController)));

router.route('/residents/status').patch(asyncHandler(userController.updateResidentStatusBulk.bind(userController)));
router.route('/residents/:residentId/status').patch(asyncHandler(userController.updateResidentStatus.bind(userController)));

router.route('/cleanup').post(asyncHandler(userController.deleteRejectedUsers.bind(userController)));

export default router;
