import prisma from '../../lib/prisma';

class UserRepo {
  getUserInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        residentLists: true,
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

class ComplaintRepository {
  createComplaint = async (data: any, userInfo: any, adminId: string) => {
    return await prisma.complaint.create({
      data: {
        ...data,
        ...userInfo,
        adminId,
      },
    });
  };

  getComplaintList = async (
    query: any,
    boardId: string,
    userId: string | undefined = undefined,
  ) => {
    const getComplaintFilter: any = {
      boardId,
      creatorId: userId, // userId가 있으면 본인 것만 조회
      status: query.status === 'ALL' ? undefined : query.status,
      isPublic: query.isPublic,
      apartmentDong: query.dong === '' ? undefined : query.dong,
      apartmentHo: query.ho === '' ? undefined : query.ho,
      deletedAt: null,
    };

    if (query.keyword) {
      getComplaintFilter.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [complaintList, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where: getComplaintFilter,
        orderBy: { createdAt: query.orderBy || 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          creator: {
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
      prisma.complaint.count({
        where: getComplaintFilter,
      }),
    ]);

    return { complaintList, totalCount };
  };

  getComplaintDetail = async (complaintId: string) => {
    const complaint = await prisma.complaint.findUnique({
      where: {
        id: complaintId,
      },
      include: {
        comments: true,
        creator: {
          select: {
            name: true,
            residentLists: {
              select: {
                apartmentDong: true,
                apartmentHo: true,
              },
            },
          },
        },
      },
    });

    return complaint;
  };

  deleteComplaint = async (complaintId: string) => {
    await prisma.complaint.delete({
      where: { id: complaintId },
    });
  };
}

const complaintRepository = new ComplaintRepository();
export default complaintRepository;
