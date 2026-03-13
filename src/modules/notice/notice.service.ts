import { BadRequestError } from '../../lib/errors';
import noticeRepository from './notice.repository';
import { userRepo, boardRepo } from './notice.repository';
import { Infer } from 'superstruct';
import noticeStruct from './notice.validation';

type Notice = Infer<typeof noticeStruct.createNotice>;
type NoticeListQuery = Infer<typeof noticeStruct.getNoticeList>;
type UpdateNotice = Infer<typeof noticeStruct.updateNotice>;

class NoticeService {
  private mapNoticeData = (data: any) => {
    return {
      noticeId: data.id,
      userId: data.adminId,
      category: data.category,
      title: data.title,
      writerName: data.admin?.name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      viewsCount: data.viewCount,
      commentsCount: data._count?.comments ?? 0,
      isPinned: data.isPinned,
    };
  };

  private mapNoticeUpdate = (data: any) => {
    return {
      ...this.mapNoticeData(data),
      content: data.content,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  };

  private mapNoticeDetail = (data: any) => {
    return {
      ...this.mapNoticeUpdate(data),
      boardName: '공지사항',
      comments: data.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        writerName: comment.user.name,
      })),
    };
  };

  createNotice = async (data: Notice, adminId: string) => {
    const admin = await userRepo.getUserInfo(adminId);
    if (!admin) {
      throw new BadRequestError('사용자 정보를 찾을 수 없습니다');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestError('게시판 작성 권한이 없습니다');
    }

    const board = await boardRepo.getBoardInfo(data.boardId);
    if (!board) {
      throw new BadRequestError('게시판 정보를 찾을 수 없습니다');
    }

    if (board.boardType !== 'NOTICE') {
      throw new BadRequestError('게시판 타입을 확인 바랍니다');
    }

    if (board.adminId !== adminId) {
      throw new BadRequestError('게시판 작성 권한이 없습니다');
    }

    const today = new Date();

    if (data.startDate && data.startDate < today) {
      throw new BadRequestError('게시글 시작일은 오늘보다 과거일 수 없습니다');
    }

    if (data.startDate && !data.endDate) {
      throw new BadRequestError('게시글 종료일을 입력해 주시기 바랍니다');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestError('게시글 종료일이 시작일보다 빠를 수 없습니다');
    }

    const eventData = data.startDate && data.endDate ? true : false;

    const notice = await noticeRepository.createNotice({ ...data, eventData }, adminId);
    return notice;
  };

  getNoticeList = async (query: NoticeListQuery, userId: string, boardId: string) => {
    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    // 유저 정보 및 보더 정보 확인
    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new BadRequestError('사용자 정보를 찾을 수 없습니다');
    }

    const board = await boardRepo.getBoardInfo(boardId);
    if (!board) {
      throw new BadRequestError('게시판 정보를 찾을 수 없습니다');
    }

    if (board.boardType !== 'NOTICE') {
      throw new BadRequestError('게시판 타입을 확인 바랍니다');
    }

    if (board.apartmentId !== user.residentLists?.apartmentId) {
      throw new BadRequestError('게시판 조회 권한이 없습니다');
    }

    const noticeList = await noticeRepository.getNoticeList({ ...query, orderBy }, boardId);

    return {
      notices: noticeList.noticeList.map((notice: any) => this.mapNoticeData(notice)),
      totalCount: noticeList.totalCount,
    };
  };

  getNoticeDetail = async (noticeId: string, userId: string) => {
    const noticeInfo = await noticeRepository.getNoticeDetail(noticeId);

    if (!noticeInfo) {
      throw new BadRequestError('게시글 정보를 찾을 수 없습니다');
    }

    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new BadRequestError('사용자 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.board.apartmentId !== user.residentLists?.apartmentId) {
      throw new BadRequestError('게시글 조회 권한이 없습니다');
    }

    const updateViewCount = await noticeRepository.getNoticeAndUpdateViewCount(noticeId);

    const notice = this.mapNoticeDetail(updateViewCount);
    return notice;
  };

  updateNotice = async (data: UpdateNotice, noticeId: string) => {
    const noticeInfo = await noticeRepository.getNoticeDetail(noticeId);

    if (!noticeInfo) {
      throw new BadRequestError('게시글 정보를 찾을 수 없습니다');
    }

    const admin = await userRepo.getUserInfo(data.userId);
    if (!admin) {
      throw new BadRequestError('사용자 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.adminId !== admin.id) {
      throw new BadRequestError('게시글 수정 권한이 없습니다');
    }

    if (noticeInfo.boardId !== data.boardId) {
      throw new BadRequestError('Board 정보 확인 바랍니다');
    }

    const today = new Date();

    if (data.startDate && data.startDate < today) {
      throw new BadRequestError('게시글 시작일은 오늘보다 과거일 수 없습니다');
    }

    if (data.startDate && !data.endDate) {
      throw new BadRequestError('게시글 종료일을 입력해 주시기 바랍니다');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestError('게시글 종료일이 시작일보다 빠를 수 없습니다');
    }

    const isDate = data.startDate && data.endDate ? true : false;

    const changedData = {
      category: data.category,
      title: data.title,
      content: data.content,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      isPinned: data.isPinned,
    };

    const updatedNotice = await noticeRepository.updateNotice(
      changedData,
      noticeId,
      admin.id,
      isDate,
    );

    const notice = this.mapNoticeData(updatedNotice);
    return notice;
  };

  deleteNotice = async (noticeId: string, adminId: string) => {
    const noticeInfo = await noticeRepository.getNoticeDetail(noticeId);
    if (!noticeInfo) {
      throw new BadRequestError('게시글 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.adminId !== adminId) {
      throw new BadRequestError('게시글 삭제 권한이 없습니다');
    }

    const admin = await userRepo.getUserInfo(adminId);

    if (!admin) {
      throw new BadRequestError('사용자 정보를 찾을 수 없습니다');
    }

    const deletedNotice = await noticeRepository.deleteNotice(noticeId, adminId);
    return deletedNotice;
  };
}

const noticeService = new NoticeService();
export default noticeService;
