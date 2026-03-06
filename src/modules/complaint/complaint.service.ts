import { Request, Response } from 'express';
import complaintRepository, { userRepo, boardRepo } from './complaint.repository';
import BadRequestError from '../../lib/errors/BadRequestError';

class ComplaintService {
  createComplaint = async (data: any, createId: string) => {
    const user = await userRepo.getUserInfo(createId);

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.role !== 'USER') {
      throw new BadRequestError('민원 작성 권한이 없습니다.');
    }

    // 유저 정보 추가 : 유효 보드 확인

    const board = await boardRepo.getBoardInfo(data.boardId);

    if (!board) {
      throw new BadRequestError('존재하지 않는 게시판입니다.');
    }

    if (board.boardType !== 'COMPLAINT') {
      throw new BadRequestError('민원 게시판이 아닙니다.');
    }

    const complaint = await complaintRepository.createComplaint(data, user.id, board.adminId);

    return complaint;
  };

  getComplaintList = async (data: any) => {
    console.log('test complaint list', data);
  };

  getComplaintDetail = async (data: any) => {
    console.log('test complaint detail', data);
  };

  updateComplaint = async (data: any) => {
    console.log('test complaint update', data);
  };

  updateComplaintStatus = async (data: any) => {
    console.log('test complaint update status', data);
  };

  deleteComplaint = async (data: any) => {
    console.log('test complaint delete', data);
  };
}

const complaintService = new ComplaintService();

export default complaintService;
