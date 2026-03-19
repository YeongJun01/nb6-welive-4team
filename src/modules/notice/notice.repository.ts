import prisma from '../../lib/prisma';

import { Infer } from 'superstruct';
import noticeStruct from './notice.validation';

import { Prisma } from '@prisma/client';
import { NotificationRepository } from '../notification/notification.repository';

type noticeData = Infer<typeof noticeStruct.noticeInfo>;
type notiData = Pick<Prisma.NotificationCreateInput, 'notiType' | 'title' | 'content' | 'url'>;

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
  getBoardById = async (boardId: string) => {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    return board;
  };

  getBoardInfoByApartmentId = async (apartmentId: string) => {
    const board = await prisma.board.findFirst({
      where: { apartmentId, boardType: 'NOTICE' },
    });

    return board;
  };
}

const boardRepo = new BoardRepo();

export { userRepo, boardRepo };

class NoticeRepository {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  createNotice = async (data: any, adminId: string) => {
    const { eventData, ...noticeData } = data;
    return await prisma.$transaction(async (tx) => {
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
        include: {
          board: true,
        },
      });

      const notiData: notiData = {
        notiType: 'NOTICE',
        title: data.title,
        content: data.content,
        url: `/notice/${notice.id}`,
      };

      // 공지사항 생성 시 관리자에게 알림
      await this.notificationRepository.createNotification(tx, notiData, adminId);

      // 공지사항 적용 입주민 확인
      const apartmentMembers = await tx.user.findMany({
        where: {
          apartmentId: notice.board.apartmentId,
          role: 'USER',
          deletedAt: null,
        },
      });

      // 공지사항 생성 시 입주민에게 알림
      await Promise.all(
        apartmentMembers.map((member) =>
          this.notificationRepository.createNotification(tx, notiData, member.id),
        ),
      );

      return notice;
    });
  };

  getNoticeList = async (query: any, boardId: string) => {
    const getNoticeFilter: any = {
      boardId,
      category: query.category ? query.category : undefined,
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

  getNoticeById = async (noticeId: string) => {
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
    return await prisma.$transaction(async (tx) => {
      const notice = await tx.notice.update({
        where: { id: noticeId },
        data: {
          ...data,
          events: {
            deleteMany: {},
            ...(isDate ? { create: { adminId, title: data.title } } : {}),
          },
        },
        include: {
          board: true,
          admin: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      const notiData: notiData = {
        notiType: 'NOTICE',
        title: data.title,
        content: data.content,
        url: `/notice/${notice.id}`,
      };

      // 공지사항 수정 시 관리자에게 알림
      await this.notificationRepository.createNotification(tx, notiData, adminId);

      // 공지사항 수정 시 입주민에게 알림
      const apartmentMembers = await tx.user.findMany({
        where: {
          apartmentId: notice.board.apartmentId,
          role: 'USER',
          deletedAt: null,
        },
      });

      await Promise.all(
        apartmentMembers.map((member) =>
          this.notificationRepository.createNotification(tx, notiData, member.id),
        ),
      );

      return notice;
    });
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

const notificationRepository = new NotificationRepository(prisma);
const noticeRepository = new NoticeRepository(notificationRepository);
export default noticeRepository;
