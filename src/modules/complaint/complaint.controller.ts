import { Request, Response } from 'express';
import complaintService from './complaint.service';
import { create, mask } from 'superstruct';
import complaintStruct from './complaint.validation';
import commonStruct from '../../structs/common.validation';

class ComplaintController {
  createComplaint = async (req: Request, res: Response) => {
    const data = create(req.body, complaintStruct.complaintInformation);
    const createId = req.user!.id;

    await complaintService.createComplaint(data, createId);

    res.status(201).json({ message: '정상적으로 민원 등록 처리되었습니다' });
  };

  getComplaintList = async (req: Request, res: Response) => {
    const query = mask(req.query, complaintStruct.getComplaintList);
    const userId = req.user!.id;

    const complaintList = await complaintService.getComplaintList(query, userId);

    res.status(200).json(complaintList);
  };

  getComplaintDetail = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    const userId = req.user!.id;

    const complaintDetail = await complaintService.getComplaintDetail(complaintId, userId);

    res.status(200).json(complaintDetail);
  };

  updateComplaint = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    const data = mask(req.body, complaintStruct.complaintUpdate);
    const userId = req.user!.id;

    const { comments, ...updateComplaint } = await complaintService.updateComplaint(
      complaintId,
      data,
      userId,
    );

    res.status(200).json(updateComplaint);
  };

  updateComplaintStatus = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    const status = mask(req.body, complaintStruct.complaintStatus);
    const adminId = req.user!.id;

    const updateComplaintStatus = await complaintService.updateComplaintStatus(
      complaintId,
      status,
      adminId,
    );

    res.status(200).json(updateComplaintStatus);
  };

  deleteComplaint = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    const userId = req.user!.id;

    await complaintService.deleteComplaint(complaintId, userId);

    res.status(204).json({ message: '정상적으로 민원 삭제 처리되었습니다' });
  };
}

const complaintController = new ComplaintController();

export default complaintController;
