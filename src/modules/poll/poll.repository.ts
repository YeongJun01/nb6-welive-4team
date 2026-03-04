import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import pollStruct from './poll.validation';

type DbPollStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED';

type Poll = Omit<Infer<typeof pollStruct.createPoll>, 'status' | 'startDate' | 'endDate'> & {
  status: DbPollStatus;
  startDate: Date;
  endDate: Date;
};

type OrderBy = 'asc' | 'desc';

class UserRepo {
  getUserInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        residentLists: {
          select: {
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
  createPoll = async (data: Poll, adminId: string) => {
    const { options, content, ...pollData } = data;

    const poll = await prisma.$transaction(async (db) => {
      const newPoll = await db.poll.create({
        data: {
          ...pollData,
          adminId,
          description: content,
        },
      });

      await db.pollOption.createMany({
        data: options.map((option: any) => ({
          pollId: newPoll.id,
          content: option.title,
        })),
      });

      return newPoll;
    });

    return poll;
  };

  getPollList = async (query: any, boardId: string) => {
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
      prisma.poll.findMany({
        where: getPollFilter,
        orderBy: { createdAt: query.orderBy },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          admin: { select: { name: true } },
        },
      }),
      prisma.poll.count({
        where: getPollFilter,
      }),
    ]);

    return { pollList, totalCount };
  };

  getPollInfo = async (pollId: string) => {
    const pollInfo = await prisma.poll.findFirst({
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

    return pollInfo;
  };

  deletePoll = async (pollId: string) => {
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        deletedAt: new Date(),
      },
    });
  };
}

const pollRepository = new PollRepository();

export default pollRepository;
