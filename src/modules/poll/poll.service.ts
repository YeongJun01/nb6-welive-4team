import { Infer } from 'superstruct';
import pollStruct from './poll.validation';
import BadRequestError from '../../lib/errors/BadRequestError';
import pollRepository from './poll.repository';

type Poll = Infer<typeof pollStruct.createPoll>;

class PollService {
  // 투표 생성
  createPoll = async (data: Poll, adminId: string) => {
    // user 기능 추가 필요

    const { startDate, endDate, options, content, ...pollData } = data;

    if (startDate > endDate) {
      throw new BadRequestError('시작일이 종료일보다 클 수 없습니다.');
    }

    if (options.length < 2) {
      throw new BadRequestError('선택지는 2개 이상이어야 합니다.');
    }

    let pollStatus: 'UPCOMING' | 'ONGOING' | 'CLOSED';

    switch (data.status) {
      case 'PENDING':
        pollStatus = 'UPCOMING';
        break;
      case 'IN_PROGRESS':
        pollStatus = 'ONGOING';
        break;
      case 'CLOSED':
        pollStatus = 'CLOSED';
        break;
      default:
        throw new BadRequestError('상태가 올바르지 않습니다.');
    }

    const poll = await pollRepository.createPoll({ ...data, status: pollStatus }, adminId);

    return poll;
  };

  // 투표 목록 조회
  getPollList = async (data: any) => {
    console.log('test service poll getPollList', data);
  };

  // 투표 상세 조회
  getPollInfo = async (data: any) => {
    console.log('test service poll getPollInfo', data);
  };

  // 투표 수정
  updatePoll = async (data: any) => {
    console.log('test service poll updatePoll', data);
  };

  // 투표 삭제
  deletePoll = async (data: any) => {
    console.log('test service poll deletePoll', data);
  };
}

const pollService = new PollService();

export default pollService;
