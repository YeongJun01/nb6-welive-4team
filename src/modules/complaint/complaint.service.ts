import complaintRepository, { userRepo, boardRepo } from './complaint.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { Infer } from 'superstruct';
import complaintStruct from './complaint.validation';
import { ComplaintResponse, ComplaintDetailResponse } from './complaint.type';
import { ComplaintListFromDB, ComplaintDetailFromDB } from './complaint.dto';

type Complaint = Infer<typeof complaintStruct.complaintInformation>;
type ComplaintUpdate = Infer<typeof complaintStruct.complaintUpdate>;
type ComplaintListQuery = Infer<typeof complaintStruct.getComplaintList>;
type status = Infer<typeof complaintStruct.complaintStatus>;

class ComplaintService {
  private mapComplaintList = (complaint: ComplaintListFromDB): ComplaintResponse => {
    return {
      complaintId: complaint.id,
      userId: complaint.creatorId,
      title: complaint.title,
      writerName: complaint.creator?.name,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      isPublic: complaint.isPublic,
      viewsCount: complaint.viewCount,
      commentsCount: complaint._count?.comments ?? 0,
      status: complaint.status,
      dong: complaint.apartmentDong,
      ho: complaint.apartmentHo,
    };
  };

  private mapComplaintDetail = (complaint: ComplaintDetailFromDB): ComplaintDetailResponse => {
    return {
      ...this.mapComplaintList(complaint),
      content: complaint.content,
      boardType: '민원',
      comments: complaint.comments?.map((comment) => ({
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
    // 유저 정보 확인
    const user = await userRepo.getUserInfo(createId);
    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (user.role !== 'USER') {
      throw new ForbiddenError('민원 작성 권한이 없습니다.');
    }

    // 게시판 정보, 타입, 권한 확인
    const board = await boardRepo.getBoardById(data.boardId);
    if (!board) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    if (board.boardType !== 'COMPLAINT') {
      throw new BadRequestError('민원 게시판이 아닙니다.');
    }

    if (board.apartmentId !== user.apartmentId) {
      throw new ForbiddenError('게시판 작성 권한이 없습니다');
    }

    const userInfo = {
      creatorId: user.id,
      apartmentDong: user.residentLists!.apartmentDong,
      apartmentHo: user.residentLists!.apartmentHo,
    };

    const createComplaintData = { ...data, ...userInfo };

    const complaint = await complaintRepository.createComplaint(createComplaintData, board.adminId);

    return complaint;
  };

  getComplaintList = async (query: ComplaintListQuery, userId: string) => {
    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    // 유저 정보 및 게시판 정보 확인
    const user = await userRepo.getUserInfo(userId);

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('민원 조회 권한이 없습니다.');
    }

    if (user.role === 'USER' && query.dong && user.residentLists!.apartmentDong !== query.dong) {
      throw new ForbiddenError('민원 조회 권한이 없습니다.');
    }

    if (user.role === 'USER' && query.ho && user.residentLists!.apartmentHo !== query.ho) {
      throw new ForbiddenError('민원 조회 권한이 없습니다.');
    }

    const complaintBoard = await boardRepo.getBoardByApartmentId(user.apartmentId!);

    if (!complaintBoard) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    // 2. 민원 리스트 조회 (권한에 따른 필터링은 레포지토리에서 수행)
    const originComplaintList = await complaintRepository.getComplaintList(
      { ...query, orderBy },
      complaintBoard.id,
      user.role,
      user.id,
    );

    return {
      complaints: originComplaintList.complaintList.map((complaint: ComplaintListFromDB) =>
        this.mapComplaintList(complaint),
      ),
      totalCount: originComplaintList.totalCount,
    };
  };

  getComplaintDetail = async (complaintId: string, userId: string) => {
    // 민원 정보 조회 및 확인
    const complaintCheck = await complaintRepository.getComplaintById(complaintId);
    const user = await userRepo.getUserInfo(userId);

    if (!complaintCheck) {
      throw new NotFoundError('존재하지 않는 민원입니다.');
    }

    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (
      complaintCheck.isPublic === false &&
      complaintCheck.creatorId !== userId &&
      complaintCheck.adminId !== userId
    ) {
      throw new ForbiddenError('민원 조회 권한이 없습니다.');
    }

    const complaintDetail = await complaintRepository.getComplaintAndUpdateViewCount(complaintId);

    return this.mapComplaintDetail(complaintDetail);
  };

  updateComplaint = async (complaintId: string, data: ComplaintUpdate, userId: string) => {
    // 민원 및 작성자 정보 조회 및 확인
    const complaint = await complaintRepository.getComplaintById(complaintId);
    const user = await userRepo.getUserInfo(userId);

    if (!complaint) {
      throw new NotFoundError('존재하지 않는 민원입니다.');
    }

    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (user.id !== complaint.creatorId) {
      throw new ForbiddenError('민원 수정 권한이 없습니다.');
    }

    if (complaint.status !== 'PENDING') {
      throw new ForbiddenError('처리중인 민원은 수정이 불가능 합니다');
    }

    const updatedComplaint = await complaintRepository.updateComplaint(complaintId, data);

    return this.mapComplaintDetail(updatedComplaint);
  };

  updateComplaintStatus = async (complaintId: string, status: status, adminId: string) => {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    const admin = await userRepo.getUserInfo(adminId);

    if (!complaint) {
      throw new NotFoundError('존재하지 않는 민원입니다.');
    }

    if (!admin) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (admin.id !== complaint.adminId) {
      throw new ForbiddenError('민원 상태를 수정할 수 없는 사용자입니다.');
    }

    const updatedComplaint = await complaintRepository.updateComplaintStatus(complaintId, status);
    return this.mapComplaintDetail(updatedComplaint);
  };

  deleteComplaint = async (complaintId: string, userId: string) => {
    // 민원 정보 조회 및 확인
    const complaint = await complaintRepository.getComplaintById(complaintId);

    if (!complaint) {
      throw new NotFoundError('존재하지 않는 민원입니다.');
    }

    if (complaint.status !== 'PENDING') {
      throw new ForbiddenError('처리중인 민원은 삭제가 불가능 합니다');
    }

    // 작성자 정보 조회 및 확인
    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (user.id !== complaint.creatorId) {
      throw new ForbiddenError('민원을 삭제할 수 없는 사용자입니다.');
    }

    await complaintRepository.deleteComplaint(complaintId, userId);
  };
}

const complaintService = new ComplaintService();

export default complaintService;
