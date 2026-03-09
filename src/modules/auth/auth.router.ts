import prisma from '../../lib/prisma';
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from '../user/user.repository';

const router = Router();
const authService = new AuthService(new UserRepository(prisma));
const authController = new AuthController(authService);

router.route('/login').post(asyncHandler(authController.login.bind(authController)));
router.route('/refresh').post(asyncHandler(authController.refresh.bind(authController)));
router.route('/logout').post(asyncHandler(authController.logout.bind(authController)));

export default router;
