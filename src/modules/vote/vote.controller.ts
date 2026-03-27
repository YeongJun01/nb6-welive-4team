import { Request, Response } from 'express';
import voteService from './vote.service';
import commonStruct from '../../structs/common.validation';
import { mask } from 'superstruct';

class VoteController {
  // 입주민 투표 처리
  createVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
    const userId = req.user!.id;

    await voteService.createVote(optionId, userId);
    res.status(201).json({ message: '정상적으로 투표 되었습니다' });
  };

  // 입주민 투표 취소
  deleteVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
    const userId = req.user!.id;

    await voteService.deleteVote(optionId, userId);
    res.status(204).json({ message: '정상적으로 투표가 취소되었습니다' });
  };
}

const voteController = new VoteController();

export default voteController;
