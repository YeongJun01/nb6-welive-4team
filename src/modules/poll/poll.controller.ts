import { Request, Response } from 'express';
import pollService from './poll.service';
import { create } from 'superstruct';
import pollStruct from './poll.validation';

class PollController {
  // 투표 생성
  createPoll = async (req: Request, res: Response) => {
    const data = create(req.body, pollStruct.createPoll);
    const adminId = '5b2195c7-a389-428d-a8d2-b9cb2b223a8c'; // admin3 정보, 업데이트 필요
    // const adminId = req.user?.id
    const poll = await pollService.createPoll(data, adminId);

    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
  };

  // 투표 목록 조회
  getPollList = async (req: Request, res: Response) => {
    console.log('test poll getPollList');
    pollService.getPollList(1);
  };

  // 투표 상세 조회
  getPollInfo = async (req: Request, res: Response) => {
    console.log('test poll getPollInfo');
    pollService.getPollInfo(1);
  };

  // 투표 수정
  updatePoll = async (req: Request, res: Response) => {
    console.log('test poll updatePoll');
    pollService.updatePoll(1);
  };

  // 투표 삭제
  deletePoll = async (req: Request, res: Response) => {
    console.log('test poll deletePoll');
    pollService.deletePoll(1);
  };
}

const pollControllser = new PollController();

export default pollControllser;
