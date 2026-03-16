import { BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import noticeRepository from './notice.repository';
import { userRepo, boardRepo } from './notice.repository';
import { Infer } from 'superstruct';
import noticeStruct from './notice.validation';

type Notice = Infer<typeof noticeStruct.noticeInfo>;
type NoticeListQuery = Infer<typeof noticeStruct.getNoticeList>;

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
    // 관리자 정보 및 타입 확인
    const admin = await userRepo.getUserInfo(adminId);
    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (admin.role !== 'ADMIN') {
      throw new ForbiddenError('게시판 작성 권한이 없습니다');
    }

    // 게시판 정보, 타입, 게시 권한 확인
    const board = await boardRepo.getBoardId(data.boardId);
    if (!board) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    if (board.boardType !== 'NOTICE') {
      throw new BadRequestError('게시판 타입을 확인 바랍니다');
    }

    if (board.adminId !== adminId) {
      throw new ForbiddenError('게시판 작성 권한이 없습니다');
    }

    // 공지 기간 유효 범위 확인
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

    // 이벤트 생성 설정
    const eventData = data.startDate && data.endDate ? true : false;

    // 공지사항 게시글 생성
    const notice = await noticeRepository.createNotice({ ...data, eventData }, adminId);

    return notice;
  };

  getNoticeList = async (query: NoticeListQuery, userId: string) => {
    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    // 유저 정보 및 게시판 정보 확인
    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    const apartmentId = user.apartmentId;
    if (!apartmentId) {
      throw new NotFoundError('아파트 정보를 찾을 수 없습니다');
    }

    const noticeId = await boardRepo.getBoardInfo(apartmentId);
    if (!noticeId) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    // 공지사항 목록 조회
    const noticeList = await noticeRepository.getNoticeList({ ...query, orderBy }, noticeId.id);

    return {
      notices: noticeList.noticeList.map((notice: any) => this.mapNoticeData(notice)),
      totalCount: noticeList.totalCount,
    };
  };

  getNoticeDetail = async (noticeId: string, userId: string) => {
    // 공지사항 정보 조회 및 확인
    const noticeInfo = await noticeRepository.getNoticeDetail(noticeId);

    if (!noticeInfo) {
      throw new NotFoundError('게시글 정보를 찾을 수 없습니다');
    }

    // 유저 정보 조회 및 정보 확인
    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.board.apartmentId !== user.apartmentId) {
      throw new ForbiddenError('게시글 조회 권한이 없습니다');
    }

    // 조회수 추가 및 공지사항 제공 정보 가공
    const updateViewCount = await noticeRepository.getNoticeAndUpdateViewCount(noticeId);
    const notice = this.mapNoticeDetail(updateViewCount);
    return notice;
  };

  updateNotice = async (data: Notice, noticeId: string, userId: string) => {
    // 공지사항 정보 조회 및 확인
    const noticeInfo = await noticeRepository.getNoticeDetail(noticeId);

    if (!noticeInfo) {
      throw new NotFoundError('게시글 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.boardId !== data.boardId) {
      throw new BadRequestError('Board 정보 확인 바랍니다');
    }

    // 관리자 정보 조회 및 확인
    const admin = await userRepo.getUserInfo(userId);
    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.adminId !== admin.id) {
      throw new ForbiddenError('게시글 수정 권한이 없습니다');
    }

    // 공지 기간 유효 범위 확인
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

    // 변경 할 데이터 가공
    const changedData = {
      category: data.category,
      title: data.title,
      content: data.content,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      isPinned: data.isPinned,
    };

    // 공지사항 수정 및 제공 정보 가공
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
      throw new NotFoundError('게시글 정보를 찾을 수 없습니다');
    }

    if (noticeInfo.adminId !== adminId) {
      throw new ForbiddenError('게시글 삭제 권한이 없습니다');
    }

    const admin = await userRepo.getUserInfo(adminId);

    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    const deletedNotice = await noticeRepository.deleteNotice(noticeId, adminId);
    return deletedNotice;
  };
}

const noticeService = new NoticeService();
export default noticeService;
