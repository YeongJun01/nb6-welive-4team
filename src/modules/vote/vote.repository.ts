import { Request, Response } from 'express';
<<<<<<< HEAD
import prisma from '../../lib/prisma';

class VoteRepository {
  getPollInfo = async (optionId: string, tx = prisma) => {
    return await tx.pollOption.findUnique({
      where: {
        id: optionId,
      },
      include: {
        poll: true,
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

  createVote = async (pollId: string, optionId: string, userId: string, tx = prisma) => {
    return await tx.vote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });
  };

  deleteVote = async (pollId: string, userId: string, tx = prisma) => {
    return await tx.vote.delete({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });
  };

  updateVoteCount = async (pollId: string, optionId: string, tx = prisma) => {
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
=======

class VoteRepository {
  createVote = async (optionId: string) => {
    console.log('test vote on!', optionId);
  };

  deleteVote = async (optionId: string) => {
    console.log('test vote off!', optionId);
>>>>>>> d1ec287 (✨ feat : Vote 기본 구조 정리)
  };
}

const voteRepository = new VoteRepository();

export default voteRepository;
