import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middlewares';
import { NotificationController, NotificationService, NotificationRepository } from './';

const router = Router();

const notificationController = new NotificationController(
  new NotificationService(new NotificationRepository(prisma)),
);

router.use(authMiddleware);

router.route('/sse').get(asyncHandler(notificationController.sse.bind(notificationController)));
router
  .route('/:notificationId/read')
  .patch(asyncHandler(notificationController.markAsRead.bind(notificationController)));

export default router;
