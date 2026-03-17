import express from 'express';
import { asyncHandler } from '../../middlewares';
import { authMiddleware } from '../../middlewares';
import eventController from './event.controller';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(eventController.getEventList));

export default router;
