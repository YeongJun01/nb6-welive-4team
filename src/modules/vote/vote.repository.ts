import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

class VoteRepository {
  getPollByOptionId = async (optionId: string, tx: Prisma.TransactionClient = prisma) => {
    return await tx.pollOption.findUnique({
      where: {
        id: optionId,
      },
      include: {
        poll: {
          include: {
            board: true,
          },
        },
      },
    });
  };

  checkVote = async (pollId: string, userId: string) => {
    return await prisma.vote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });
  };

  createVote = async (
    pollId: string,
    optionId: string,
    userId: string,
    tx: Prisma.TransactionClient = prisma,
  ) => {
    return await tx.vote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });
  };

  deleteVote = async (pollId: string, userId: string, tx: Prisma.TransactionClient = prisma) => {
    return await tx.vote.delete({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });
  };

  updateVoteCount = async (
    pollId: string,
    optionId: string,
    tx: Prisma.TransactionClient = prisma,
  ) => {
    const countVote = await tx.vote.count({
      where: {
        pollId,
        optionId,
      },
    });

    return await tx.pollOption.update({
      where: {
        id: optionId,
      },
      data: {
        voteCount: countVote,
      },
    });
  };
}

const voteRepository = new VoteRepository();

export default voteRepository;
