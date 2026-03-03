import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import pollStruct from './poll.validation';

type DbPollStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED';

type Poll = Omit<Infer<typeof pollStruct.createPoll>, 'status'> & {
  status: DbPollStatus;
};

type OrderBy = 'asc' | 'desc';

class PollRepository {
  createPoll = async (data: Poll, adminId: string) => {
    const { startDate, endDate, options, content, ...pollData } = data;

    const poll = await prisma.$transaction(async (db) => {
      const newPoll = await db.poll.create({
        data: {
          ...pollData,
          adminId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
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
    const [pollList, totalCount] = await Promise.all([
      prisma.poll.findMany({
        where: {
          boardId,
          status: query.status,
          OR: [
            { title: { contains: query.keyword, mode: 'insensitive' } },
            { description: { contains: query.keyword, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: query.orderBy },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          admin: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.poll.count({
        where: {
          boardId,
          status: query.status,
          OR: [
            { title: { contains: query.keyword, mode: 'insensitive' } },
            { description: { contains: query.keyword, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { pollList, totalCount };
  };

  getPollInfo = async (pollId: string) => {
    const pollInfo = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        admin: {
          select: {
            name: true,
          },
        },
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
}

const pollRepository = new PollRepository();

export default pollRepository;
