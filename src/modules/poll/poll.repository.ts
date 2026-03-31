import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import pollStruct from './poll.validation';

import { Prisma } from '@prisma/client';
import { NotificationRepository } from '../notification/notification.repository';

import { GetPollListQuery } from './poll.dto';

type DbPollStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED';

type Poll = Omit<Infer<typeof pollStruct.pollInformation>, 'status' | 'startDate' | 'endDate'> & {
  status: DbPollStatus;
  startDate: Date;
  endDate: Date;
};

type CreatePollResult = Prisma.PollGetPayload<{
  include: { board: true };
}>;

type UpdatePoll = Omit<Infer<typeof pollStruct.updatePoll>, 'status' | 'startDate' | 'endDate'> & {
  status: DbPollStatus;
  startDate: Date;
  endDate: Date;
};

type notificationData = Pick<
  Prisma.NotificationCreateInput,
  'notiType' | 'title' | 'content' | 'url'
>;

type notiType = 'POLL_START' | 'POLL_SET' | 'POLL_END';

type pollOption = {
  pollId?: string;
  title: string;
};

type GetPollListQueryFromDB = Omit<GetPollListQuery, 'status'> & {
  status: DbPollStatus | undefined;
};
type GetPollListFilter = Prisma.PollWhereInput;

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
      where: { apartmentId, boardType: 'POLL' },
    });

    return board;
  };
}

const boardRepo = new BoardRepo();

export { userRepo, boardRepo };

class PollRepository {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  // 아파트 입주민 조회 (권한 필터링 포함)
  private getApartmentMembers = async (tx: Prisma.TransactionClient, poll: Poll) => {
    return;
  };

  // 투표 관련 알림 발송
  private sendPollNotifications = async (
    tx: Prisma.TransactionClient,
    poll: CreatePollResult,
    notiType: notiType,
  ) => {
    const isAll = poll.buildingPermission.includes('ALL');

    const apartmentMembers = await tx.residentList.findMany({
      where: {
        apartmentId: poll.board.apartmentId,
        userId: { not: null },
        ...(isAll ? {} : { apartmentDong: { in: poll.buildingPermission } }),
        deletedAt: null,
      },
      select: { userId: true },
    });

    const notificationData: notificationData = {
      notiType,
      title: poll.title,
      content: poll.description,
      url: `/poll/${poll.id}`,
    };

    await Promise.all(
      apartmentMembers.map((member) =>
        this.notificationRepository.createNotification(tx, notificationData, member.userId!),
      ),
    );
  };

  // 투표 기반 공지사항 생성
  private createNoticeFromPoll = async (tx: Prisma.TransactionClient, poll: CreatePollResult) => {
    await tx.notice.create({
      data: {
        boardId: poll.boardId,
        title: poll.title,
        content: poll.description,
        adminId: poll.adminId,
        category: 'RESIDENT_VOTE',
        startDate: poll.startDate,
        endDate: poll.endDate,
      },
    });
  };

  // 투표 생성
  createPoll = async (data: Poll, adminId: string) => {
    const { options, content, ...pollData } = data;

    return await prisma.$transaction(async (tx) => {
      // 투표 게시글 생성
      const newPoll = await tx.poll.create({
        data: {
          ...pollData,
          adminId,
          description: content,
          pollOptions: {
            // 투표 옵션 생성
            create: options.map((option: pollOption) => ({
              content: option.title,
            })),
          },
          events: {
            // 이벤트 생성
            create: {
              adminId,
              title: data.title,
            },
          },
        },
        include: {
          board: true,
          admin: { select: { name: true } },
          pollOptions: true,
        },
      });

      const notificationData: notificationData = {
        notiType: 'POLL_SET',
        title: data.title,
        content: data.content,
        url: `/poll/${newPoll.id}`,
      };

      // 투표 생성 시 관리자에게 알림
      await this.notificationRepository.createNotification(tx, notificationData, adminId);

      // 투표 적용 입주민 확인 및 알림 발송
      await this.sendPollNotifications(tx, newPoll, 'POLL_SET');

      return newPoll;
    });
  };

  // 투표 목록 조회
  getPollList = async (query: GetPollListQueryFromDB, boardId: string) => {
    // 투표 목록 조회 필터링
    const getPollFilter: GetPollListFilter = {
      boardId,
      buildingPermission: query.buildingPermission
        ? { hasSome: query.buildingPermission }
        : undefined,
      status: query.status ? query.status : undefined,
      deletedAt: null,
    };

    if (query.keyword) {
      getPollFilter.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [pollList, totalCount] = await Promise.all([
      // 투표 목록 조회
      prisma.poll.findMany({
        where: getPollFilter,
        orderBy: { createdAt: query.orderBy },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          board: true,
          admin: { select: { name: true } },
        },
      }),
      // 전체 카운트 진행
      prisma.poll.count({
        where: getPollFilter,
      }),
    ]);

    return { polls: pollList, totalCount };
  };

  // 투표 상세 조회
  getPollDetail = async (pollId: string) => {
    // 투표 게시글 상세 조회
    return await prisma.poll.findFirst({
      where: {
        id: pollId,
        deletedAt: null,
      },
      include: {
        admin: { select: { name: true } },
        board: true,
        pollOptions: {
          select: {
            id: true,
            content: true,
            voteCount: true,
          },
        },
      },
    });
  };

  // 투표 조회수 증가 및 상세 조회
  getPollAndUpdateViewCount = async (pollId: string) => {
    return await prisma.poll.update({
      where: { id: pollId },
      data: { viewCount: { increment: 1 } },
      include: {
        board: true,
        admin: { select: { name: true } },
        pollOptions: {
          select: {
            id: true,
            content: true,
            voteCount: true,
          },
        },
      },
    });
  };

  // 투표 수정
  updatePoll = async (data: UpdatePoll, adminId: string, pollId: string) => {
    const { options, content, ...pollData } = data;

    const poll = await prisma.$transaction(async (db) => {
      // 투표 게시글 수정
      const newPoll = await db.poll.update({
        where: { id: pollId },
        data: {
          ...pollData,
          adminId,
          description: content,
        },
        include: {
          board: true,
          admin: { select: { name: true } },
          pollOptions: true,
        },
      });

      // 투표 옵션 삭제 후 재생성
      await db.pollOption.deleteMany({
        where: {
          pollId,
        },
      });

      await db.pollOption.createMany({
        data: options.map((option: pollOption) => ({
          pollId: newPoll.id,
          content: option.title,
        })),
      });

      // 투표 연관 event 수정
      // 유니크 제약이 없어서 updateMany를 사용하고, AND로 adminId와 pollId를 지정
      await db.event.updateMany({
        where: { AND: [{ adminId }, { pollId }] },
        data: {
          title: newPoll.title,
        },
      });

      return newPoll;
    });

    return poll;
  };

  // 투표 삭제
  deletePoll = async (pollId: string) => {
    await prisma.$transaction(async (db) => {
      // 투표 게시글 delete 처리
      const deletedPoll = await db.poll.update({
        where: { id: pollId },
        data: {
          deletedAt: new Date(),
          pollOptions: {
            deleteMany: {},
          },
        },
      });

      // 투표 연관 event 삭제 처리
      await db.event.deleteMany({
        where: {
          AND: [{ adminId: deletedPoll.adminId }, { pollId: deletedPoll.id }],
        },
      });
    });
  };

  // 시간에 따른 투표 상태 벌크 업데이트
  updatePollStatusByTime = async () => {
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // 1. UPCOMING -> CLOSED (시스템 에러등에 의해 시작 없이 종료 된 경우)
      let instantClosedUpdates = { count: 0 };

      const pollsToClose = await tx.poll.findMany({
        where: {
          status: 'UPCOMING',
          endDate: { lte: now },
          deletedAt: null,
        },
        include: { board: true },
      });

      if (pollsToClose.length > 0) {
        instantClosedUpdates = await tx.poll.updateMany({
          where: { id: { in: pollsToClose.map((p) => p.id) } },
          data: { status: 'CLOSED' },
        });

        for (const poll of pollsToClose) {
          await this.sendPollNotifications(tx, poll, 'POLL_END');
        }
      }

      // 2. UPCOMING -> ONGOING (투표가 시작되고 아직 종료되지 않은 경우)
      let startUpdates = { count: 0 };
      const pollsToStart = await tx.poll.findMany({
        where: {
          status: 'UPCOMING',
          startDate: { lte: now },
          endDate: { gt: now },
          deletedAt: null,
        },
        include: { board: true },
      });

      if (pollsToStart.length > 0) {
        startUpdates = await tx.poll.updateMany({
          where: { id: { in: pollsToStart.map((p) => p.id) } },
          data: { status: 'ONGOING' },
        });

        for (const poll of pollsToStart) {
          await this.sendPollNotifications(tx, poll, 'POLL_START');
        }
      }

      // 3. ONGOING -> CLOSED (정상적으로 진행하다가 종료 된 경우)
      let endUpdates = { count: 0 };
      const pollsToEnd = await tx.poll.findMany({
        where: {
          status: 'ONGOING',
          endDate: { lte: now },
          deletedAt: null,
        },
        include: { board: true },
      });

      if (pollsToEnd.length > 0) {
        endUpdates = await tx.poll.updateMany({
          where: { id: { in: pollsToEnd.map((p) => p.id) } },
          data: { status: 'CLOSED' },
        });

        for (const poll of pollsToEnd) {
          await this.createNoticeFromPoll(tx, poll);
          await this.sendPollNotifications(tx, poll, 'POLL_END');
        }
      }

      return { instantClosedUpdates, startUpdates, endUpdates };
    });
  };
}
const notificationRepository = new NotificationRepository(prisma);
const pollRepository = new PollRepository(notificationRepository);

export default pollRepository;
