import complaintRepository, { userRepo, boardRepo } from './complaint.repository';
import BadRequestError from '../../lib/errors/BadRequestError';
import { Infer } from 'superstruct';
import complaintStruct from './complaint.validation';
import { ComplaintResponse, ComplaintDetailResponse } from './complaint.type';

type Complaint = Infer<typeof complaintStruct.complaintInformation>;
type ComplaintUpdate = Infer<typeof complaintStruct.complaintUpdate>;
type ComplaintListQuery = Infer<typeof complaintStruct.getComplaintList>;
type status = Infer<typeof complaintStruct.complaintStatus>;

class ComplaintService {
  private mapComplaintList = (complaint: any): ComplaintResponse => {
    return {
      complaintId: complaint.id,
      userId: complaint.creatorId,
      title: complaint.title,
      writerName: complaint.creator?.name,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      isPublic: complaint.isPublic,
      viewCount: complaint.viewCount,
      commentsCount: complaint._count?.comments,
      status: complaint.status,
      dong: complaint.apartmentDong,
      ho: complaint.apartmentHo,
    };
  };

  private mapComplaintDetail = (complaint: any): ComplaintDetailResponse => {
    return {
      ...this.mapComplaintList(complaint),
      content: complaint.content,
      boardType: 'COMPLAINT',
      comments: complaint.comments?.map((comment: any) => ({
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        writerName: comment.user?.name,
      })),
    };
  };

  createComplaint = async (data: Complaint, createId: string) => {
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

    const userInfo = {
      creatorId: user.id,
      apartmentDong: user.residentLists?.apartmentDong,
      apartmentHo: user.residentLists?.apartmentHo,
    };

    const complaint = await complaintRepository.createComplaint(data, userInfo, board.adminId);

    return complaint;
  };

  getComplaintList = async (query: ComplaintListQuery, boardId: string, userId: string) => {
    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    // 1. 유저 정보 확인
    const user = await userRepo.getUserInfo(userId);

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestError('민원 조회 권한이 없습니다.');
    }

    // 2. isPublic에 따른 민원 리스트 조회
    let originComplaintList;
    if (query.isPublic !== true && user.role === 'USER') {
      // 2-1. 비공개 민원 & 입주민 조회
      originComplaintList = await complaintRepository.getComplaintList(
        { ...query, orderBy },
        boardId,
        user.id,
      );
    } else {
      // 2-2. 공개 민원 || 비공개 + 관리자 조회
      originComplaintList = await complaintRepository.getComplaintList(
        { ...query, orderBy },
        boardId,
      );

      // 유저 인증 기능 추가 후 세부 분류 진행
    }

    return {
      complaints: originComplaintList.complaintList.map((complaint: any) =>
        this.mapComplaintList(complaint),
      ),
      totalCount: originComplaintList.totalCount,
    };
  };

  getComplaintDetail = async (complaintId: string, userId: string) => {
    const complaintCheck = await complaintRepository.getComplaintById(complaintId);
    const user = await userRepo.getUserInfo(userId);

    if (!complaintCheck) {
      throw new BadRequestError('존재하지 않는 민원입니다.');
    }

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (
      complaintCheck.isPublic === false &&
      (complaintCheck.creatorId !== userId || complaintCheck.adminId !== userId)
    ) {
      throw new BadRequestError('민원 조회 권한이 없습니다.');
    }

    const complaintDetail = await complaintRepository.getComplaintAndUpdateViewCount(complaintId);

    return this.mapComplaintDetail(complaintDetail);
  };

  updateComplaint = async (complaintId: string, data: ComplaintUpdate, userId: string) => {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    const user = await userRepo.getUserInfo(userId);

    if (!complaint) {
      throw new BadRequestError('존재하지 않는 민원입니다.');
    }

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.id !== complaint.creatorId) {
      throw new BadRequestError('민원 수정 권한이 없습니다.');
    }

    if (complaint.status !== 'PENDING') {
      throw new BadRequestError('처리중인 민원은 수정이 불가능 합니다');
    }

    const updatedComplaint = await complaintRepository.updateComplaint(complaintId, data);

    return this.mapComplaintDetail(updatedComplaint);
  };

  updateComplaintStatus = async (complaintId: string, status: status, adminId: string) => {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    const admin = await userRepo.getUserInfo(adminId);

    if (!complaint) {
      throw new BadRequestError('존재하지 않는 민원입니다.');
    }

    if (!admin) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (admin.id !== complaint.adminId) {
      throw new BadRequestError('민원 상태를 수정할 수 없는 사용자입니다.');
    }

    const updatedComplaint = await complaintRepository.updateComplaintStatus(complaintId, status);
    return this.mapComplaintDetail(updatedComplaint);
  };

  deleteComplaint = async (complaintId: string, userId: string) => {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    const user = await userRepo.getUserInfo(userId);

    if (!complaint) {
      throw new BadRequestError('존재하지 않는 민원입니다.');
    }

    if (complaint.status !== 'PENDING') {
      throw new BadRequestError('처리중인 민원은 삭제가 불가능 합니다');
    }

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.id !== complaint.creatorId) {
      throw new BadRequestError('민원을 삭제할 수 없는 사용자입니다.');
    }

    await complaintRepository.deleteComplaint(complaintId, userId);
  };
}

const complaintService = new ComplaintService();

export default complaintService;
