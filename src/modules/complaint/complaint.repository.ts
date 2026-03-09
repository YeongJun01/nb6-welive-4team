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
  createComplaint = async (data: any, creatorId: string, adminId: string) => {
    return await prisma.complaint.create({
      data: {
        ...data,
        creatorId,
        adminId,
      },
    });
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
}

const complaintRepository = new ComplaintRepository();
export default complaintRepository;
