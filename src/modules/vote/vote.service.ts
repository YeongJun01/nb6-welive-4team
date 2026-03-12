import { Request, Response } from 'express';
import voteRepository from './vote.repository';
import { userRepo } from '../poll/poll.repository';
import prisma from '../../lib/prisma';
import { BadRequestError } from '../../lib/errors';

class VoteService {
  private validateVoteAbility = async (optionId: string, userId: string) => {
    // 투표 자체에 대한 정보 검증
    const pollDetail = await voteRepository.getPollInfo(optionId);

    if (!pollDetail) {
      throw new BadRequestError('존재하지 않는 투표입니다.');
    }

    if (pollDetail.poll.status !== 'ONGOING' || pollDetail.poll.endDate < new Date()) {
      throw new BadRequestError('투표가 진행중이 아닙니다.');
    }

    // 투표자 정보 검증
    const user = await userRepo.getUserInfo(userId);

    if (!user) {
      throw new BadRequestError('존재하지 않는 사용자입니다.');
    }

    if (user.role !== 'USER') {
      // || user.boardId.pollId !== pollDetail.poll.boardId
      // user 로그인 작업 후 추가 설정 필요
      throw new BadRequestError('투표 권한이 없습니다.');
    }

    return pollDetail;
  };

  createVote = async (optionId: string, userId: string) => {
    const pollDetail = await this.validateVoteAbility(optionId, userId);

    // 과거 투표 여부 확인
    const voteCheck = await voteRepository.checkVote(pollDetail.pollId, userId);

    if (voteCheck) {
      throw new BadRequestError('이미 투표하셨습니다.');
    }

    const pollVote = await prisma.$transaction(async (tx: any) => {
      await voteRepository.createVote(pollDetail.pollId, optionId, userId, tx);
      await voteRepository.updateVoteCount(pollDetail.pollId, optionId, tx);
      return await voteRepository.getPollInfo(optionId, tx);
    });

    return pollVote;
  };

  deleteVote = async (optionId: string, userId: string) => {
    const pollDetail = await this.validateVoteAbility(optionId, userId);

    // 과거 투표 여부 확인
    const voteCheck = await voteRepository.checkVote(pollDetail.pollId, userId);

    if (!voteCheck) {
      throw new BadRequestError('투표하지 않았습니다.');
    }

    const pollVote = await prisma.$transaction(async (tx: any) => {
      await voteRepository.deleteVote(pollDetail.pollId, userId, tx);
      await voteRepository.updateVoteCount(pollDetail.pollId, optionId, tx);
      return await voteRepository.getPollInfo(optionId, tx);
    });

    return pollVote;
  };
}

const voteService = new VoteService();

export default voteService;
