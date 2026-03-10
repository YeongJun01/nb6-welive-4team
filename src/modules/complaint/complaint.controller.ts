import { Request, Response } from 'express';
import complaintService from './complaint.service';
import { create, mask } from 'superstruct';
import complaintStruct from './complaint.validation';
import commonStruct from '../../structs/common.validation';

class ComplaintController {
  createComplaint = async (req: Request, res: Response) => {
    const data = create(req.body, complaintStruct.complaintInformation);
    const createId = '04736128-0eff-49a6-bb05-029c3920a9af'; // user1 정보, 업데이트 필요
    // const createId = req.user?.id

    const complaint = await complaintService.createComplaint(data, createId);

    res.status(201).json({ message: '정상적으로 민원 등록 처리되었습니다' });
  };

  getComplaintList = async (req: Request, res: Response) => {
    const query = mask(req.query, complaintStruct.getComplaintList);
    const userId = '04736128-0eff-49a6-bb05-029c3920a9af'; // user1 정보, 업데이트 필요
    // const createId = req.user?.id
    const boardId = '2fa86d76-403b-4b8d-8c79-ab2b44113a39'; // 임시 정보 전달

    const complaintList = await complaintService.getComplaintList(query, boardId, userId);

    res.status(200).json(complaintList);
  };

  getComplaintDetail = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);

    // 조회 하려는 사람의 id
    const userId = '04736128-0eff-49a6-bb05-029c3920a9af'; // user1 정보, 업데이트 필요
    // const userId = req.user?.id;
    const complaintDetail = await complaintService.getComplaintDetail(complaintId, userId);

    res.status(200).json(complaintDetail);
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
