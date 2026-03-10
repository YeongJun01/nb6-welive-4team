import { Request, Response } from 'express';
import pollService from './poll.service';
import { create, mask } from 'superstruct';
import pollStruct from './poll.validation';
import commonStruct from '../../structs/common.validation';

class PollController {
  // 투표 생성
  createPoll = async (req: Request, res: Response) => {
    const data = create(req.body, pollStruct.pollInformation);
    const adminId = '5b2195c7-a389-428d-a8d2-b9cb2b223a8c'; // admin3 정보, 업데이트 필요
    // const adminId = req.user?.id
    const poll = await pollService.createPoll(data, adminId);

    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
  };

  // 투표 목록 조회
  getPollList = async (req: Request, res: Response) => {
    const query = mask(req.query, pollStruct.getPollList);
    const boardId = '4b33ee9d-ee9c-49f9-9cef-78db5750b349'; // admin3 정보, 업데이트 필요
    // const boardId = req.user?.board.pollId;
    const adminId = '5b2195c7-a389-428d-a8d2-b9cb2b223a8c'; // admin3 정보, 업데이트 필요
    // const adminId = req.user?.id
    const pollList = await pollService.getPollList(query, boardId, adminId);
    res.status(200).json(pollList);
  };

  // 투표 상세 조회
  getPollInfo = async (req: Request, res: Response) => {
    const pollId = mask(req.params.pollId, commonStruct.uuid);
    const boardId = '4b33ee9d-ee9c-49f9-9cef-78db5750b349'; // admin3 정보, 업데이트 필요
    // const boardId = req.params.board.pollId;
    const pollInfo = await pollService.getPollInfo(pollId, boardId);
    res.status(200).json(pollInfo);
  };

  // 투표 수정
  updatePoll = async (req: Request, res: Response) => {
    const data = create(req.body, pollStruct.pollInformation);
    const adminId = '5b2195c7-a389-428d-a8d2-b9cb2b223a8c'; // admin3 정보, 업데이트 필요
    // const adminId = req.user?.id
    const pollId = mask(req.params.pollId, commonStruct.uuid);
    const poll = await pollService.updatePoll(data, adminId, pollId);

    res.status(201).json({ message: '정상적으로 수정 처리되었습니다' });
  };

  // 투표 삭제
  deletePoll = async (req: Request, res: Response) => {
    const pollId = mask(req.params.pollId, commonStruct.uuid);
    const boardId = '4b33ee9d-ee9c-49f9-9cef-78db5750b349'; // admin3 정보, 업데이트 필요
    // const boardId = req.params.board.pollId;
    pollService.deletePoll(pollId, boardId);
    res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
  };
}

const pollControllser = new PollController();

export default pollControllser;
