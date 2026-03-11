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
}

const noticeRepository = new NoticeRepository();
export default noticeRepository;
