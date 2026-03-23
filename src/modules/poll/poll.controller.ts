import { Request, Response } from 'express';
import pollService from './poll.service';
import { create, mask } from 'superstruct';
import pollStruct from './poll.validation';
import commonStruct from '../../structs/common.validation';

class PollController {
  // 투표 생성
  createPoll = async (req: Request, res: Response) => {
    const data = create(req.body, pollStruct.pollInformation);
    const adminId = req.user!.id;
    await pollService.createPoll(data, adminId);

    res.status(201).json({ message: '정상적으로 투표 등록 처리되었습니다' });
  };

  // 투표 목록 조회
  getPollList = async (req: Request, res: Response) => {
    const query = mask(req.query, pollStruct.getPollList);
    const userId = req.user!.id;

    const pollList = await pollService.getPollList(query, userId);
    res.status(200).json(pollList);
  };

  // 투표 상세 조회
  getPollDetail = async (req: Request, res: Response) => {
    const pollId = mask(req.params.pollId, commonStruct.uuid);
    const userId = req.user!.id;

    const pollInfo = await pollService.getPollDetail(pollId, userId);
    res.status(200).json(pollInfo);
  };

  // 투표 수정
  updatePoll = async (req: Request, res: Response) => {
    const data = create(req.body, pollStruct.updatePoll);
    const adminId = req.user!.id;
    const pollId = mask(req.params.pollId, commonStruct.uuid);

    const poll = await pollService.updatePoll(data, adminId, pollId);

    res.status(201).json(poll);
  };

  // 투표 삭제
  deletePoll = async (req: Request, res: Response) => {
    const pollId = mask(req.params.pollId, commonStruct.uuid);
    const adminId = req.user!.id;

    await pollService.deletePoll(pollId, adminId);
    res.status(200).json({ message: '정상적으로 투표 삭제 처리되었습니다' });
  };
}

const pollControllser = new PollController();

export default pollControllser;
