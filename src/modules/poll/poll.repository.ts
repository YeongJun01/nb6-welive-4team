import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import pollStruct from './poll.validation';

type DbPollStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED';

type Poll = Omit<Infer<typeof pollStruct.createPoll>, 'status'> & {
  status: DbPollStatus;
};

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
        data: options.map((option) => ({
          pollId: newPoll.id,
          content: option.title,
        })),
      });

      return newPoll;
    });

    return poll;
  };
}

const pollRepository = new PollRepository();

export default pollRepository;
