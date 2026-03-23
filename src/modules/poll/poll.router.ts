import express from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import pollControllser from './poll.controller';
import { authMiddleware } from '../../middlewares';

const router = express.Router();

router.use(authMiddleware);

router.post('/', asyncHandler(pollControllser.createPoll));
router.get('/', asyncHandler(pollControllser.getPollList));
router.get('/:pollId', asyncHandler(pollControllser.getPollDetail));
router.patch('/:pollId', asyncHandler(pollControllser.updatePoll));
router.delete('/:pollId', asyncHandler(pollControllser.deletePoll));

export default router;
