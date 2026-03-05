import { Request, Response } from 'express';
<<<<<<< HEAD
import voteService from './vote.service';
=======
import voteRepository from './vote.repository';
>>>>>>> d1ec287 (✨ feat : Vote 기본 구조 정리)
import commonStruct from '../../structs/common.validation';
import { mask } from 'superstruct';

class VoteController {
  // 입주민 투표 처리
  createVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
<<<<<<< HEAD
    const userId = 'ec093420-784b-4919-af81-01a1389ad582'; // 임시 정보
    // const userId = mask(req.user?.id, commonStruct.uuid);
    await voteService.createVote(optionId, userId);
    res.status(201).json({ message: '정상적으로 투표 되었습니다' });
=======
    voteRepository.createVote(optionId);
    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
>>>>>>> d1ec287 (✨ feat : Vote 기본 구조 정리)
  };

  // 입주민 투표 취소
  deleteVote = async (req: Request, res: Response) => {
    const optionId = mask(req.params.optionId, commonStruct.uuid);
<<<<<<< HEAD
    const userId = 'ec093420-784b-4919-af81-01a1389ad582'; // 임시 정보
    // const userId = mask(req.user?.id, commonStruct.uuid);
    await voteService.deleteVote(optionId, userId);
    res.status(201).json({ message: '정상적으로 투표가 취소되었습니다' });
=======
    voteRepository.deleteVote(optionId);
    res.status(201).json({ message: '정상적으로 취소 처리되었습니다' });
>>>>>>> d1ec287 (✨ feat : Vote 기본 구조 정리)
  };
}

const voteController = new VoteController();

export default voteController;
