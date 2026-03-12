import { BadRequestError } from '../../lib/errors';
import noticeRepository from './notice.repository';
import { userRepo, boardRepo } from './notice.repository';
import { Infer } from 'superstruct';
import noticeStruct from './notice.validation';

type Notice = Infer<typeof noticeStruct.createNotice>;
type UpdateNotice = Infer<typeof noticeStruct.updateNotice>;

class NoticeService {
  private mapNoticeData = (data: any) => {
    return {
      noticeId: data.noticeId,
      userId: data.userId,
      category: data.category,
      title: data.title,
      content: data.content,
      startDate: data.startDate,
      endDate: data.endDate,
      writerName: data.admin.name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      viewsCount: data.viewsCount,
      commentsCount: data._count.comments,
      isPinned: data.isPinned,
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

    if (data.startDate && !data.endDate) {
      throw new BadRequestError('게시글 종료일을 입력해 주시기 바랍니다');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestError('게시글 종료일이 시작일보다 빠를 수 없습니다');
    }

    const notice = await noticeRepository.createNotice(data, adminId);
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

    if (data.startDate && !data.endDate) {
      throw new BadRequestError('게시글 종료일을 입력해 주시기 바랍니다');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestError('게시글 종료일이 시작일보다 빠를 수 없습니다');
    }

    const changedData = {
      category: data.category,
      title: data.title,
      content: data.content,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      isPinned: data.isPinned,
    };

    const updatedNotice = await noticeRepository.updateNotice(changedData, noticeId);
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

    const deletedNotice = await noticeRepository.deleteNotice(noticeId);
    return deletedNotice;
  };
}

const noticeService = new NoticeService();
export default noticeService;
