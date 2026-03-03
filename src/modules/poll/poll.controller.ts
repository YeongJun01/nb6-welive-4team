import { Request, Response } from 'express';
import pollService from './poll.service';
import { create, mask } from 'superstruct';
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
    const parsedQuery = {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const query = mask(parsedQuery, pollStruct.getPollList);
    const boardId = '4b33ee9d-ee9c-49f9-9cef-78db5750b349'; // admin3 정보, 업데이트 필요
    // const boardId = req.params.board.pollId;
    const pollList = await pollService.getPollList(query, boardId);
    res.status(200).json(pollList);
  };

  // 투표 상세 조회
  getPollInfo = async (req: Request, res: Response) => {
    const pollId = mask(req.params.pollId, pollStruct.uuid);
    const boardId = '4b33ee9d-ee9c-49f9-9cef-78db5750b349'; // admin3 정보, 업데이트 필요
    const pollInfo = await pollService.getPollInfo(pollId, boardId);
    res.status(200).json(pollInfo);
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
