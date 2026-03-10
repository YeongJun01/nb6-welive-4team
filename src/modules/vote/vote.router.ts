import express from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import voteController from './vote.controller';
const router = express.Router();

router.post('/:optionId/vote', asyncHandler(voteController.createVote));
router.delete('/:optionId/vote', asyncHandler(voteController.deleteVote));

export default router;
