import { BadRequestError } from '../../lib/errors/BadRequestError';
import noticeRepository from './notice.repository';
import { userRepo, boardRepo } from './notice.repository';

class NoticeService {
  createNotice = async (data: any, adminId: string) => {
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

    const notice = await noticeRepository.createNotice(data, adminId);
    return notice;
  };

  deleteNotice = async (noticeId: string, adminId: string) => {
    const notice = await noticeRepository.getNoticeDetail(noticeId);
    if (!notice) {
      throw new BadRequestError('게시글 정보를 찾을 수 없습니다');
    }

    if (notice.adminId !== adminId) {
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
