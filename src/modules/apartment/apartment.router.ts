import express from 'express';
import ApartmentController from './apartment.controller';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router
  .get('/public', asyncHandler(ApartmentController.getPublicApartments)) // 공개된 아파트 목록 조회용 엔드포인트 추가
  .get('/public/:id', asyncHandler(ApartmentController.getApartmentByIdForPublic)); // 아파트 상세 조회 (공개 정보) 엔드포인트 추가

router
  .get('/', authMiddleware, asyncHandler(ApartmentController.getApartments))
  .get('/:id', authMiddleware, asyncHandler(ApartmentController.getApartmentById));

export default router;
