import prisma from '../../lib/prisma';

// User 검색용 레포지토리
class UserRepo {
  getUserInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        residentLists: {
          select: {
            apartmentId: true,
            apartmentDong: true,
          },
        },
      },
    });

    return user;
  };
}

const userRepo = new UserRepo();
class BoardRepo {
  getBoardInfo = async (id: string) => {
    const board = await prisma.board.findUnique({
      where: { id },
    });

    return board;
  };
}

const boardRepo = new BoardRepo();

export { userRepo, boardRepo };

class NoticeRepository {
  createNotice = async (data: any, adminId: string) => {
    const notice = await prisma.notice.create({
      data: {
        ...data,
        adminId,
      },
    });

    return notice;
  };

  getNoticeDetail = async (noticeId: string) => {
    return await prisma.notice.findUnique({
      where: { id: noticeId },
    });
  };

  updateNotice = async (data: any, noticeId: string) => {
    const notice = await prisma.notice.update({
      where: { id: noticeId },
      data: {
        ...data,
      },
      include: {
        admin: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return notice;
  };

  deleteNotice = async (noticeId: string) => {
    return await prisma.notice.update({
      where: { id: noticeId },
      data: {
        deletedAt: new Date(),
      },
    });
  };
}

const noticeRepository = new NoticeRepository();
export default noticeRepository;
