import { Request, Response } from 'express';
import complaintService from './complaint.service';
import { create, mask } from 'superstruct';
import complaintStruct from './complaint.validation';
import commonStruct from '../../structs/common.validation';

class ComplaintController {
  createComplaint = async (req: Request, res: Response) => {
    const data = create(req.body, complaintStruct.complaintInformation);
    const createId = 'c1b7eb1b-608b-41a1-a5ed-75c168baa1e3'; // user1 정보, 업데이트 필요
    // const createId = req.user?.id

    const complaint = await complaintService.createComplaint(data, createId);

    res.status(201).json({ message: '정상적으로 민원 등록 처리되었습니다' });
  };

  getComplaintList = async (req: Request, res: Response) => {
    const query = mask(req.query, complaintStruct.getComplaintList);
    const userId = 'c1b7eb1b-608b-41a1-a5ed-75c168baa1e3'; // user1 정보, 업데이트 필요
    // const createId = req.user?.id
    const boardId = 'af4f6837-1534-491b-9eb0-b8e80cef219b'; // 임시 정보 전달

    const complaintList = await complaintService.getComplaintList(query, boardId, userId);

    res.status(200).json(complaintList);
  };

  getComplaintDetail = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);

    // 조회 하려는 사람의 id
    const userId = 'c1b7eb1b-608b-41a1-a5ed-75c168baa1e3'; // user1 정보, 업데이트 필요
    // const userId = req.user?.id;
    const complaintDetail = await complaintService.getComplaintDetail(complaintId, userId);

    res.status(200).json(complaintDetail);
  };

  updateComplaint = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    const data = mask(req.body, complaintStruct.complaintUpdate);
    const userId = 'c1b7eb1b-608b-41a1-a5ed-75c168baa1e3'; // user1 정보, 업데이트 필요

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
    const adminId = 'd4b4b700-2c46-4a0f-b7f7-7e1705b41546'; // admin id, 업데이트 필요
    const userId = 'c1b7eb1b-608b-41a1-a5ed-75c168baa1e3'; // user1 정보, 업데이트 필요

    const updateComplaintStatus = await complaintService.updateComplaintStatus(
      complaintId,
      status,
      adminId,
    );

    res.status(200).json(updateComplaintStatus);
  };

  deleteComplaint = async (req: Request, res: Response) => {
    const complaintId = mask(req.params.complaintId, commonStruct.uuid);
    // 삭제 하려는 사람의 id
    // const userId = 'ffd146ba-b02e-4abf-a671-cb469787343c'; // user1 정보, 업데이트 필요
    const userId = '04736128-0eff-49a6-bb05-029c3920a9af'; // user1 정보, 업데이트 필요

    await complaintService.deleteComplaint(complaintId, userId);

    res.status(201).json({ message: '정상적으로 민원 삭제 처리되었습니다' });
  };
}

const complaintController = new ComplaintController();

export default complaintController;
