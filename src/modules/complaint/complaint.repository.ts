import prisma from '../../lib/prisma';

import { Infer } from 'superstruct';
import complaintStruct from './complaint.validation';

import { Prisma } from '@prisma/client';
import { NotificationRepository } from '../notification/notification.repository';

type status = Infer<typeof complaintStruct.complaintStatus>;
type notiData = Pick<Prisma.NotificationCreateInput, 'notiType' | 'title' | 'content' | 'url'>;

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
  getBoardWithId = async (boardId: string) => {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    return board;
  };

  getBoardInfoWithApartmentId = async (apartmentId: string) => {
    const board = await prisma.board.findFirst({
      where: { apartmentId, boardType: 'COMPLAINT' },
    });

    return board;
  };
}

const boardRepo = new BoardRepo();

export { userRepo, boardRepo };

class ComplaintRepository {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  private notificationType = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'COMPLAINT_IN_PROGRESS';
      case 'RESOLVED':
        return 'COMPLAINT_RESOLVED';
      case 'REJECTED':
        return 'COMPLAINT_REJECTED';
      default:
        return 'COMPLAINT_RAISED';
    }
  };

  createComplaint = async (data: any, userInfo: any, adminId: string) => {
    return await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          ...data,
          ...userInfo,
          adminId,
        },
      });

      const notiData: notiData = {
        notiType: 'COMPLAINT_RAISED',
        title: data.title,
        content: data.content,
        url: `/complaints/${complaint.id}`,
      };

      // 민원 생성시 관리자에게 알림
      await this.notificationRepository.createNotification(tx, notiData, adminId);

      return complaint;
    });
  };

  getComplaintList = async (query: any, boardId: string, role: string, userId: string) => {
    const getComplaintFilter: any = {
      boardId,
      status: query.status === 'ALL' ? undefined : query.status,
      apartmentDong: query.dong === '' ? undefined : query.dong,
      apartmentHo: query.ho === '' ? undefined : query.ho,
      deletedAt: null,
    };

    // 역할별 조회 권한 로직
    if (role === 'USER') {
      if (query.isPublic === true) {
        // 공개된 글만 조회
        getComplaintFilter.isPublic = true;
      } else if (query.isPublic === false) {
        // 본인이 작성한 비공개 글만 조회
        getComplaintFilter.isPublic = false;
        getComplaintFilter.creatorId = userId;
      } else {
        // 전체 조회: 공개된 글 OR 본인이 작성한 글
        getComplaintFilter.OR = [{ isPublic: true }, { creatorId: userId }];
      }
    } else {
      // 관리자: 모든 글 조회 가능
      if (query.isPublic !== undefined) {
        getComplaintFilter.isPublic = query.isPublic;
      }
    }

    // 키워드가 있는 경우, 역할 권한에 키워드 추가
    if (query.keyword) {
      const keywordFilter = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
      ];

      if (getComplaintFilter.OR) {
        getComplaintFilter.AND = [{ OR: getComplaintFilter.OR }, { OR: keywordFilter }];
        delete getComplaintFilter.OR;
      } else {
        getComplaintFilter.OR = keywordFilter;
      }
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

  getComplaintById = async (complaintId: string) => {
    const complaint = await prisma.complaint.findUnique({
      where: {
        id: complaintId,
      },
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

  getComplaintAndUpdateViewCount = async (complaintId: string) => {
    return await prisma.complaint.update({
      where: { id: complaintId },
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
  };

  updateComplaint = async (complaintId: string, data: any) => {
    return await prisma.complaint.update({
      where: { id: complaintId },
      data: { ...data },
      include: {
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
  };

  updateComplaintStatus = async (complaintId: string, data: status) => {
    return await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id: complaintId },
        data: { status: data.status },
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

      // 민원 상태 변경시 사용자에게 알림
      const notiTypeSetting = this.notificationType(complaint.status);

      const notiData: notiData = {
        notiType: notiTypeSetting as any,
        title: complaint.title,
        content: complaint.content,
        url: `/complaints/${complaint.id}`,
      };

      await this.notificationRepository.createNotification(tx, notiData, complaint.creatorId);

      return complaint;
    });
  };

  deleteComplaint = async (complaintId: string, userId: string) => {
    await prisma.complaint.delete({
      where: {
        id: complaintId,
        creatorId: userId,
      },
    });
  };
}

const notificationRepository = new NotificationRepository(prisma);
const complaintRepository = new ComplaintRepository(notificationRepository);

export default complaintRepository;
