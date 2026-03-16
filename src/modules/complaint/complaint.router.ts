import express from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import complaintController from './complaint.controller';
import { authMiddleware } from '../../middlewares';

const router = express.Router();

router.use(authMiddleware);

router.post('/', asyncHandler(complaintController.createComplaint));

router.get('/', asyncHandler(complaintController.getComplaintList));
router.get('/:complaintId', asyncHandler(complaintController.getComplaintDetail));

router.patch('/:complaintId', asyncHandler(complaintController.updateComplaint));
router.patch('/:complaintId/status', asyncHandler(complaintController.updateComplaintStatus));

router.delete('/:complaintId', asyncHandler(complaintController.deleteComplaint));

export default router;
