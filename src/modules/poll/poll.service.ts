import { Infer } from 'superstruct';
import pollStruct from './poll.validation';
import BadRequestError from '../../lib/errors/BadRequestError';
import pollRepository from './poll.repository';

type Poll = Infer<typeof pollStruct.createPoll>;

class PollService {
  private getMappedStatus = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'PENDING';
      case 'ONGOING':
        return 'IN_PROGRESS';
      case 'CLOSED':
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  };

  private mapPollList = (poll: any) => {
    return {
      pollId: poll.id,
      userId: poll.adminId,
      title: poll.title,
      writerName: poll.admin?.name,
      buildingPermission: poll.buildingPermission,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      startDate: poll.startDate,
      endDate: poll.endDate,
      status: this.getMappedStatus(poll.status),
    };
  };

  private mapPollInfo = (poll: any) => {
    return {
      ...this.mapPollList(poll),
      boardName: '주민 투표',
      content: poll.description,
      options: poll.pollOptions.map((option: any) => ({
        optionId: option.id,
        content: option.content,
        voteCount: option.voteCount === null ? 0 : option.voteCount,
      })),
    };
  };

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
  getPollList = async (query: any, boardId: string) => {
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    let pollStatus: 'UPCOMING' | 'ONGOING' | 'CLOSED' | undefined;

    switch (query.status) {
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
        pollStatus = undefined;
        break;
    }

    const { pollList, totalCount } = await pollRepository.getPollList(
      { ...query, status: pollStatus, orderBy },
      boardId,
    );

    return {
      pollList: pollList.map((poll: any) => this.mapPollList(poll)),
      totalCount,
    };
  };

  // 투표 상세 조회
  getPollInfo = async (pollId: string, boardId: string) => {
    const pollInfo = await pollRepository.getPollInfo(pollId);
    if (!pollInfo) {
      throw new BadRequestError('존재하지 않는 투표입니다.');
    }

    if (pollInfo.boardId !== boardId) {
      throw new BadRequestError('접근 권한이 없습니다.');
    }

    return this.mapPollInfo(pollInfo);
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
