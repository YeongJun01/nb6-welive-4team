import prisma from '../../lib/prisma';
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middlewares';
import { CommentController, CommentRepository, CommentService } from './';
import complaintRepository from '../complaint/complaint.repository';
import noticeRepository from '../notice/notice.repository';

const router = Router();

const commentRepository = new CommentRepository(prisma);
const commentService = new CommentService(commentRepository, complaintRepository, noticeRepository);
const commentController = new CommentController(commentService);

router.post('/', authMiddleware, asyncHandler(commentController.create.bind(commentController)));

router
  .patch('/:id', authMiddleware, asyncHandler(commentController.update.bind(commentController)))
  .delete('/:id', authMiddleware, asyncHandler(commentController.delete.bind(commentController)));

export default router;
