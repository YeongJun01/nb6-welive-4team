import express from 'express';
import ApartmentController from './apartment.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router
  .get('/', authMiddleware, asyncHandler(ApartmentController.getApartments))
  .get('/public', asyncHandler(ApartmentController.getPublicApartments)) // 공개된 아파트 목록 조회용 엔드포인트 추가
  .get('/:id', authMiddleware, asyncHandler(ApartmentController.getApartmentById))
  .get('/public/:id', asyncHandler(ApartmentController.getApartmentByIdForPublic)); // 아파트 상세 조회 (공개 정보) 엔드포인트 추가

export default router;
