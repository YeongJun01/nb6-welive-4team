import { Request, Response } from 'express';
import pollService from './poll.service';

class PollController {
  // 투표 생성
  createPoll = async (req: Request, res: Response) => {
    console.log('test poll create');
    pollService.createPoll(1);
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
