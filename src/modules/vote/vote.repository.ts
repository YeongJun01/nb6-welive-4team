import { Request, Response } from 'express';

class VoteRepository {
  createVote = async (optionId: string) => {
    console.log('test vote on!', optionId);
  };

  deleteVote = async (optionId: string) => {
    console.log('test vote off!', optionId);
  };
}

const voteRepository = new VoteRepository();

export default voteRepository;
