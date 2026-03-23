import express from 'express';
import { asyncHandler } from '../../middlewares';
import { authMiddleware } from '../../middlewares';
import eventController from './event.controller';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(eventController.getEventList));

// FE 확인 결과 : POST DELETE API는 필요하지 않음
// BE 개발 상태 : Poll, Notice Create 작업 시 Event 데이터 함께 등록됨
// router.post('/', authMiddleware, asyncHandler(eventController.createEvent));
// router.delete('/:id', authMiddleware, asyncHandler(eventController.deleteEvent));

export default router;
