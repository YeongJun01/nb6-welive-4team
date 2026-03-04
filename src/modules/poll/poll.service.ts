import { Infer } from 'superstruct';
import pollStruct from './poll.validation';
import BadRequestError from '../../lib/errors/BadRequestError';
import pollRepository from './poll.repository';
import { userRepo } from './poll.repository';

type Poll = Infer<typeof pollStruct.createPoll>;

class PollService {
  private dbMappedStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'UPCOMING';
      case 'IN_PROGRESS':
        return 'ONGOING';
      case 'CLOSED':
        return 'CLOSED';
      case 'ALL':
        return 'ALL';
      default:
        throw new BadRequestError('상태가 올바르지 않습니다.');
    }
  };

  private getMappedStatus = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'PENDING';
      case 'ONGOING':
        return 'IN_PROGRESS';
      case 'CLOSED':
        return 'CLOSED';
      default:
        throw new BadRequestError('상태가 올바르지 않습니다.');
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

    const { options, status, ...pollData } = data;

    const today = new Date();
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate < today) {
      throw new BadRequestError('투표 시작일을 재설정 바랍니다.');
    }

    if (startDate > endDate) {
      throw new BadRequestError('투표 시작일이 종료일보다 빠를 수 없습니다.');
    }

    if (options.length < 2) {
      throw new BadRequestError('선택지는 2개 이상이어야 합니다.');
    }

    const pollStatus = this.dbMappedStatus(status);

    if (pollStatus === 'ALL') {
      throw new BadRequestError('상태가 올바르지 않습니다.');
    }

    const poll = await pollRepository.createPoll(
      { ...data, status: pollStatus, startDate, endDate },
      adminId,
    );

    return poll;
  };

  // 투표 목록 조회
  getPollList = async (query: any, boardId: string, userId: string) => {
    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';
    const pollStatus = this.dbMappedStatus(query.status);

    // 유저 기능 생성 후 추가 작업 진행
    // const user = await userRepo.getResident(userId);
    // if (!user) {
    //   throw new BadRequestError('존재하지 않는 유저입니다.');
    // }

    // const buildingPermission = query.buildingPermission
    //   ? query.buildingPermission
    //   : [user.apartmentDong, 'all'];
    // getPollList 객체에 값 전달

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

    // 일반 유저 정보를 기반으로 동 설정 필요
    // if (
    //   pollInfo.buildingPermission !== 'ALL' &&
    //   pollInfo.buildingPermission !== userInfo.residentLists.apartmentDong
    // ) {
    //   throw new BadRequestError('접근 권한이 없습니다.');
    // }

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
