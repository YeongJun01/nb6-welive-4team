import { Request, Response } from 'express';
import complaintService from './complaint.service';
import { create, mask } from 'superstruct';
import complaintStruct from './complaint.validation';
import commonStruct from '../../structs/common.validation';

class ComplaintController {
  createComplaint = async (req: Request, res: Response) => {
    const data = create(req.body, complaintStruct.complaintInformation);
    const createId = '022b5089-5d24-40aa-b2dc-4477e0d0add0'; // user4 정보, 업데이트 필요
    // const createId = req.user?.id

    const complaint = await complaintService.createComplaint(data, createId);

    res.status(201).json({ message: '정상적으로 민원 등록 처리되었습니다' });
  };

  getComplaintList = async (req: Request, res: Response) => {
    console.log('test complaint controller list');

    await complaintService.getComplaintList(1);
  };

  getComplaintDetail = async (req: Request, res: Response) => {
    console.log('test complaint controller detail');

    await complaintService.getComplaintDetail(1);
  };

  updateComplaint = async (req: Request, res: Response) => {
    console.log('test complaint update controller');

    await complaintService.updateComplaint(1);
  };

  updateComplaintStatus = async (req: Request, res: Response) => {
    console.log('test complaint status update controller');

    await complaintService.updateComplaintStatus(1);
  };

  deleteComplaint = async (req: Request, res: Response) => {
    console.log('test complaint delete controller');

    await complaintService.deleteComplaint(1);
  };
}

const complaintController = new ComplaintController();

export default complaintController;
