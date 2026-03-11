import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import pollStruct from './poll.validation';

type DbPollStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED';

type Poll = Omit<Infer<typeof pollStruct.pollInformation>, 'status' | 'startDate' | 'endDate'> & {
  status: DbPollStatus;
  startDate: Date;
  endDate: Date;
};

type OrderBy = 'asc' | 'desc';

// User 검색용 레포지토리
class UserRepo {
  getUserInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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

export { userRepo };

class PollRepository {
  // 투표 생성
  createPoll = async (data: Poll, adminId: string) => {
    const { options, content, ...pollData } = data;

    const poll = await prisma.$transaction(async (db) => {
      // 투표 게시글 생성
      const newPoll = await db.poll.create({
        data: {
          ...pollData,
          adminId,
          description: content,
        },
      });

      // 투표 옵션 생성
      await db.pollOption.createMany({
        data: options.map((option: any) => ({
          pollId: newPoll.id,
          content: option.title,
        })),
      });

      // 투표 연관 event 생성
      await db.event.create({
        data: {
          adminId,
          pollId: newPoll.id,
          title: newPoll.title,
        },
      });

      return newPoll;
    });

    return poll;
  };

  // 투표 목록 조회
  getPollList = async (query: any, boardId: string) => {
    // 투표 목록 조회 필터링
    const getPollFilter: any = {
      boardId,
      // buildingPermission: {
      //   hasSome: query.buildingPermission,
      // },
      buildingPermission: query.buildingPermission
        ? { hasSome: query.buildingPermission }
        : undefined,
      status: query.status === 'ALL' ? undefined : query.status,
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
          admin: { select: { name: true } },
        },
      }),
      // 전체 카운트 진행
      prisma.poll.count({
        where: getPollFilter,
      }),
    ]);

    return { pollList, totalCount };
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
  updatePoll = async (data: Poll, adminId: string, pollId: string) => {
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
      });

      // 투표 옵션 삭제 후 재생성
      await db.pollOption.deleteMany({
        where: {
          pollId,
        },
      });

      await db.pollOption.createMany({
        data: options.map((option: any) => ({
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
}

const pollRepository = new PollRepository();

export default pollRepository;
