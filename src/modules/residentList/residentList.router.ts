import { ResidentListController } from './residentList.controller';
import { ResidentListService } from './residentList.service';
import { ResidentListRepository } from './residentList.repository';
import { UserService } from '../user';
import { UserRepository } from '../user/user.repository';
import { authMiddleware } from '../../middlewares/authMiddleware';
import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';

const router = Router();
router.use(authMiddleware);

const residentListService = new ResidentListService(
  new ResidentListRepository(prisma),
  new UserRepository(prisma),
);
const residentListController = new ResidentListController(residentListService);

router
  .route('/')
  .get(asyncHandler(residentListController.getResidentsList.bind(residentListController)))
  .post(asyncHandler(residentListController.createResident.bind(residentListController)));

router
  .route('/:id')
  .get(asyncHandler(residentListController.getResidentById.bind(residentListController)))
  .patch(asyncHandler(residentListController.updateResident.bind(residentListController)))
  .delete(asyncHandler(residentListController.deleteResident.bind(residentListController)))
  .put(asyncHandler(residentListController.softDeleteResident.bind(residentListController)));

export default router;
