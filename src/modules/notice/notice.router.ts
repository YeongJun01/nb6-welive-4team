import express from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import noticeController from './notice.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/', asyncHandler(noticeController.createNotice));
router.get('/', asyncHandler(noticeController.getNoticeList));
router.get('/:noticeId', asyncHandler(noticeController.getNoticeDetail));
router.patch('/:noticeId', asyncHandler(noticeController.updateNotice));
router.delete('/:noticeId', asyncHandler(noticeController.deleteNotice));

export default router;
