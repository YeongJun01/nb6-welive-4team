import { Request, Response } from 'express';
import voteRepository from './vote.repository';
import commonStruct from '../../structs/common.validation';
import { mask } from 'superstruct';

class VoteController {
  // 입주민 투표 처리
  createVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
    voteRepository.createVote(optionId);
    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
  };

  // 입주민 투표 취소
  deleteVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
    voteRepository.deleteVote(optionId);
    res.status(201).json({ message: '정상적으로 취소 처리되었습니다' });
  };
}

const voteController = new VoteController();

export default voteController;
