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

  getEventInfo = async (noticeId: string, adminId: string) => {
    return await prisma.event.findFirst({
      where: {
        noticeId,
        adminId,
      },
    });
  };
}

const boardRepo = new BoardRepo();

export { userRepo, boardRepo };

class NoticeRepository {
  createNotice = async (data: any, adminId: string) => {
    const { eventData, ...noticeData } = data;
    const notice = await prisma.notice.create({
      data: {
        ...noticeData,
        adminId,
        events: eventData
          ? {
              create: {
                adminId,
                title: data.title,
              },
            }
          : undefined,
      },
    });

    return notice;
  };

  getNoticeList = async (query: any, boardId: string) => {
    const getNoticeFilter: any = {
      boardId,
      status: query.status ? query.status : undefined,
      deletedAt: null,
    };

    if (query.search) {
      getNoticeFilter.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [noticeList, totalCount] = await Promise.all([
      prisma.notice.findMany({
        where: getNoticeFilter,
        orderBy: { createdAt: query.orderBy || 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          admin: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.notice.count({
        where: getNoticeFilter,
      }),
    ]);

    return { noticeList, totalCount };
  };

  getNoticeDetail = async (noticeId: string) => {
    return await prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        board: true,
        events: true,
      },
    });
  };

  getNoticeAndUpdateViewCount = async (noticeId: string) => {
    return await prisma.notice.update({
      where: { id: noticeId },
      data: { viewCount: { increment: 1 } },
      include: {
        comments: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        admin: {
          select: {
            name: true,
          },
        },
      },
    });
  };

  updateNotice = async (data: any, noticeId: string, adminId: string, isDate: boolean) => {
    const notice = await prisma.notice.update({
      where: { id: noticeId },
      data: {
        ...data,
        events: {
          deleteMany: {},
          ...(isDate ? { create: { adminId, title: data.title } } : {}),
        },
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

  deleteNotice = async (noticeId: string, adminId: string) => {
    return await prisma.notice.update({
      where: { id: noticeId, adminId },
      data: {
        deletedAt: new Date(),
        events: {
          deleteMany: {},
        },
      },
    });
  };
}

const noticeRepository = new NoticeRepository();
export default noticeRepository;
