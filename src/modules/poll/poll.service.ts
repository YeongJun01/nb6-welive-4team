import { Infer } from 'superstruct';
import pollStruct from './poll.validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import pollRepository, { userRepo, boardRepo } from './poll.repository';

type Poll = Infer<typeof pollStruct.pollInformation>;

class PollService {
  private dateCheck = (startDate: Date, endDate: Date) => {
    const today = new Date();

    if (startDate < today) {
      throw new BadRequestError('투표 시작일을 재설정 바랍니다.');
    }

    if (startDate > endDate) {
      throw new BadRequestError('투표 시작일이 종료일보다 빠를 수 없습니다.');
    }

    return { startDate, endDate };
  };

  private customBuildingPermission = (buildingPermission: string[]) => {
    // 빈 배열, 공백 제거
    const filteredBuildingPermission = buildingPermission
      .map((b: string) => b.trim())
      .filter((b: string) => b !== '');

    // 완전한 빈 배열인 경우, ALL로 설정
    const customBuildingPermission =
      filteredBuildingPermission.length === 0 ? ['ALL'] : filteredBuildingPermission;

    return customBuildingPermission;
  };

  private dbMappedStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'UPCOMING';
      case 'IN_PROGRESS':
        return 'ONGOING';
      case 'CLOSED':
        return 'CLOSED';
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
    // 관리자 정보 및 타입 확인
    const admin = await userRepo.getUserInfo(adminId);
    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (admin.role !== 'ADMIN') {
      throw new ForbiddenError('게시판 작성 권한이 없습니다');
    }

    // 게시판 정보, 타입, 게시 권한 확인
    const board = await boardRepo.getBoardInfoByApartmentId(admin.apartmentId!);
    if (!board) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    if (board.boardType !== 'POLL') {
      throw new BadRequestError('투표 게시판이 아닙니다');
    }

    if (board.adminId !== adminId) {
      throw new ForbiddenError('게시판 작성 권한이 없습니다');
    }

    const { options, status, buildingPermission, ...pollData } = data;

    const { startDate, endDate } = this.dateCheck(data.startDate, data.endDate);

    if (options.length < 2) {
      throw new BadRequestError('선택지는 2개 이상이어야 합니다.');
    }

    const pollStatus = this.dbMappedStatus(status);
    const customBuildingPermission = this.customBuildingPermission(buildingPermission);

    const poll = await pollRepository.createPoll(
      {
        ...data,
        status: pollStatus,
        startDate,
        endDate,
        buildingPermission: customBuildingPermission,
      },
      adminId,
    );

    return poll;
  };

  // 투표 목록 조회
  getPollList = async (query: any, userId: string) => {
    // 유저 정보 및 게시판 정보 확인
    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new BadRequestError('존재하지 않는 유저입니다.');
    }

    const board = await boardRepo.getBoardInfoByApartmentId(user.apartmentId!);
    if (!board) {
      throw new NotFoundError('게시판 정보를 찾을 수 없습니다');
    }

    // 검색 필터값 재설정

    // 임의로 정렬 추가
    const orderBy = query.orderBy === 'oldest' ? 'asc' : 'desc';

    // status 상태 변경
    const pollStatus = query.status ? this.dbMappedStatus(query.status) : undefined;

    // 사용자 동 정보를 기반으로 buildingPermission 설정
    let customBuildingPermission = query.buildingPermission;

    if (!customBuildingPermission && user.role === 'USER') {
      customBuildingPermission = [user.residentLists!.apartmentDong, 'ALL'];
    }

    const { pollList, totalCount } = await pollRepository.getPollList(
      { ...query, status: pollStatus, orderBy, buildingPermission: customBuildingPermission },
      board.id,
    );

    return {
      pollList: pollList.map((poll: any) => this.mapPollList(poll)),
      totalCount,
    };
  };

  // 투표 상세 조회
  getPollDetail = async (pollId: string, userId: string) => {
    // 투표 정보 확인
    const pollInfo = await pollRepository.getPollDetail(pollId);
    if (!pollInfo) {
      throw new NotFoundError('존재하지 않는 투표입니다.');
    }

    const user = await userRepo.getUserInfo(userId);
    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (pollInfo.board.apartmentId !== user.apartmentId) {
      throw new ForbiddenError('투표 조회 권한이 없습니다');
    }

    // 사용자 동 정보를 기반으로 buildingPermission 확인
    if (
      user.role === 'USER' &&
      !pollInfo.buildingPermission.includes('ALL') &&
      !pollInfo.buildingPermission.includes(user.residentLists!.apartmentDong)
    ) {
      throw new ForbiddenError('투표 조회 권한이 없습니다');
    }

    const pollDetail = await pollRepository.getPollAndUpdateViewCount(pollId);
    const poll = this.mapPollInfo(pollDetail);

    return poll;
  };

  // 투표 수정
  updatePoll = async (data: Poll, adminId: string, pollId: string) => {
    // 투표 정보 확인
    const pollInfo = await pollRepository.getPollDetail(pollId);

    if (!pollInfo) {
      throw new NotFoundError('존재하지 않는 투표입니다.');
    }

    if (pollInfo.boardId !== data.boardId) {
      throw new BadRequestError('Board 정보 확인 바랍니다');
    }

    // 유저 기능 생성 후 추가 작업 진행
    const admin = await userRepo.getUserInfo(adminId);
    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (pollInfo.adminId !== adminId) {
      throw new ForbiddenError('투표 수정 권한이 없습니다');
    }

    if (pollInfo.status !== 'UPCOMING') {
      throw new BadRequestError('투표가 진행중이거나 종료되어 수정할 수 없습니다.');
    }

    const { options, status, buildingPermission, ...pollData } = data;

    const { startDate, endDate } = this.dateCheck(data.startDate, data.endDate);

    if (options.length < 2) {
      throw new BadRequestError('선택지는 2개 이상이어야 합니다.');
    }

    const pollStatus = this.dbMappedStatus(status);
    const customBuildingPermission = this.customBuildingPermission(buildingPermission);

    const updatePoll = await pollRepository.updatePoll(
      {
        ...data,
        status: pollStatus,
        startDate,
        endDate,
        buildingPermission: customBuildingPermission,
      },
      adminId,
      pollId,
    );

    return updatePoll;
  };

  // 투표 삭제
  deletePoll = async (pollId: string, adminId: string) => {
    // 투표 정보 확인
    const pollInfo = await pollRepository.getPollDetail(pollId);
    if (!pollInfo) {
      throw new NotFoundError('존재하지 않는 투표입니다.');
    }

    if (pollInfo.status !== 'UPCOMING') {
      throw new BadRequestError('투표가 진행중이거나 종료되어 삭제할 수 없습니다.');
    }

    // 관리자 정보 확인
    const admin = await userRepo.getUserInfo(adminId);
    if (!admin) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    if (pollInfo.adminId !== adminId) {
      throw new ForbiddenError('투표 삭제 권한이 없습니다');
    }

    await pollRepository.deletePoll(pollId);
  };
}

const pollService = new PollService();

export default pollService;
