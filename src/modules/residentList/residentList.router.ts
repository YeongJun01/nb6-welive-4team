import { ResidentListController } from './residentList.controller';
import { ResidentListService } from './residentList.service';
import { ResidentListRepository } from './residentList.repository';
import { UserService } from '../user';
import { UserRepository } from '../user/user.repository';
import { authMiddleware } from '../../middlewares/authMiddleware';
import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { uploadCsv } from '../../middlewares/upload';

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
  .route('/from-file')
  .post(
    uploadCsv,
    asyncHandler(residentListController.uploadResidentsByCsv.bind(residentListController)),
  );

router
  .route('/file/template')
  .get(
    asyncHandler(residentListController.downloadResidentCsvTemplate.bind(residentListController)),
  );

router
  .route('/file')
  .get(asyncHandler(residentListController.downloadResidentsCsv.bind(residentListController)));

router
  .route('/:id')
  .get(asyncHandler(residentListController.getResidentById.bind(residentListController)))
  .patch(asyncHandler(residentListController.updateResident.bind(residentListController)))
  .delete(asyncHandler(residentListController.deleteResident.bind(residentListController)))
  .put(asyncHandler(residentListController.softDeleteResident.bind(residentListController)));

// FE 확인 결과 : /residents/from-user/{userId} API는 필요하지 않음, 따라서 백엔드 개발에서 생략함

export default router;
