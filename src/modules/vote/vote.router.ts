import express from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import voteController from './vote.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/:optionId/vote', asyncHandler(voteController.createVote));
router.delete('/:optionId/vote', asyncHandler(voteController.deleteVote));

export default router;
