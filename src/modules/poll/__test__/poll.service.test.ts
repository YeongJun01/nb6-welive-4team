import pollService from '../poll.service';
import pollRepository, { userRepo, boardRepo } from '../poll.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../lib/errors';

// [초기 셋팅] 의존 모듈 Mock 처리 : poll, notification
jest.mock('../poll.repository');
jest.mock('../../notification/notification.repository');

describe('Poll Service 단위 테스트', () => {
  // [초기 셋팅] Mock 및 Spy 변수 선언
  let mockAdmin: any;
  let mockUser1: any;
  let mockUser2: any;
  let mockBoard: any;
  let mockPoll: any;
  let mockPollWithComments: any;
  let mockQuery: any;

  let findUserSpy: jest.SpyInstance;
  let findBoardSpy: jest.SpyInstance;
  let findBoardByApartmentIdSpy: jest.SpyInstance;
  let findPollSpy: jest.SpyInstance;

  let createPollSpy: jest.SpyInstance;
  let getPollListSpy: jest.SpyInstance;
  let getPollAndUpdateViewCountSpy: jest.SpyInstance;
  let updatePollSpy: jest.SpyInstance;
  let deletePollSpy: jest.SpyInstance;

  // [테스트 셋팅] 테스트용 Mock 데이터 및 Spy 생성
  beforeAll(() => {
    mockAdmin = { id: 'admin1', role: 'ADMIN', apartmentId: 'apt1' };
    mockUser1 = {
      id: 'user1',
      role: 'USER',
      apartmentId: 'apt1',
      residentLists: {
        apartmentId: 'apt1',
        apartmentDong: '101',
        apartmentHo: '101',
        contact: '01087654321poll',
        name: '사용자1 poll',
        approvalStatus: 'APPROVED',
      },
    };
    mockUser2 = {
      id: 'user2',
      role: 'USER',
      apartmentId: 'apt2',
      residentLists: {
        apartmentId: 'apt1',
        apartmentDong: '102',
        apartmentHo: '102',
        contact: '01087654321poll',
        name: '사용자2 poll',
        approvalStatus: 'APPROVED',
      },
    };
    mockBoard = {
      id: 'pollBoardId',
      adminId: mockAdmin.id,
      apartmentId: 'apt1',
      boardType: 'POLL',
    };

    mockPoll = [
      {
        id: 'poll1',
        boardId: 'pollBoardId',
        adminId: mockAdmin.id,
        status: 'UPCOMING',
        buildingPermission: ['ALL'],
        title: '투표 1',
        description: '내용 1',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        pollOptions: [{ content: '투표 1 - 옵션1' }, { content: '투표 1 - 옵션2' }],
        viewCount: 10,
        admin: { name: '관리자1' },
      },
      {
        id: 'poll2',
        boardId: 'pollBoardId',
        adminId: mockAdmin.id,
        status: 'ONGOING',
        buildingPermission: ['101'],
        title: '투표 2',
        description: '내용 2',
        startDate: new Date(Date.now()),
        endDate: new Date(Date.now() + 86400000),
        pollOptions: [{ content: '투표 2 - 옵션1' }, { content: '투표 2 - 옵션2' }],
        viewCount: 5,
        admin: { name: '관리자1' },
      },
      {
        id: 'poll3',
        boardId: 'pollBoardId',
        adminId: mockAdmin.id,
        status: 'ONGOING',
        buildingPermission: ['102'],
        title: '투표 3',
        description: '내용 3',
        startDate: new Date(Date.now()),
        endDate: new Date(Date.now() + 86400000),
        pollOptions: [{ content: '투표 3 - 옵션1' }, { content: '투표 3 - 옵션2' }],
        viewCount: 5,
        admin: { name: '관리자1' },
      },
    ];

    mockPollWithComments = {
      ...mockPoll[0],
      content: '상세 내용입니다.',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      comments: [
        {
          id: 'comment1',
          userId: 'user1',
          content: '댓글1입니다',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { name: '사용자1' },
        },
      ],
    };

    mockQuery = { page: 1, limit: 10, category: 'MAINTENANCE', search: '' };

    findUserSpy = jest.spyOn(userRepo, 'getUserInfo');
    findBoardSpy = jest.spyOn(boardRepo, 'getBoardById');
    findBoardByApartmentIdSpy = jest.spyOn(boardRepo, 'getBoardInfoByApartmentId');
    findPollSpy = jest.spyOn(pollRepository, 'getPollDetail');

    createPollSpy = jest.spyOn(pollRepository, 'createPoll');
    getPollListSpy = jest.spyOn(pollRepository, 'getPollList');
    getPollAndUpdateViewCountSpy = jest.spyOn(pollRepository, 'getPollAndUpdateViewCount');
    updatePollSpy = jest.spyOn(pollRepository, 'updatePoll');
    deletePollSpy = jest.spyOn(pollRepository, 'deletePoll');
  });

  // [테스트 셋팅] 각 테스트 실행 전 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // [테스트 종료] Spy 복원
  afterAll(() => {
    findUserSpy.mockRestore();
    findBoardSpy.mockRestore();
  });

  describe('createPoll 테스트', () => {
    it('[200] 성공적으로 투표를 생성한다', async () => {
      const inputData = {
        boardId: mockBoard.id,
        status: 'PENDING',
        buildingPermission: ['ALL'],
        title: '투표 테스트',
        content: '내용',
        startDate: new Date(Date.now() + 86400000), 
        endDate: new Date(Date.now() + 172800000),
        options: [{ title: '옵션1' }, { title: '옵션2' }],
      };

      findUserSpy.mockResolvedValue(mockAdmin);
      findBoardSpy.mockResolvedValue(mockBoard);
      createPollSpy.mockResolvedValue({ id: 'poll1', ...inputData });

      const result = await pollService.createPoll(inputData as any, mockAdmin.id);

      expect(result).toHaveProperty('id', 'poll1');
      expect(result).toHaveProperty('title', '투표 테스트');

      // FE: PENDING -> BE: UPCOMING 상태 변환 확인
      const callArgs = createPollSpy.mock.calls[0][0];
      expect(callArgs.status).toBe('UPCOMING');
    });

    it('[403] 관리자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      const inputData = { boardId: mockBoard.id, title: '제목' };

      await expect(pollService.createPoll(inputData as any, mockUser1.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('[404] 게시판 정보가 없는 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      findBoardSpy.mockResolvedValue(null);
      const inputData = {
        boardId: mockBoard.id,
        status: 'PENDING',
        buildingPermission: ['ALL'],
        title: '투표 테스트',
        content: '내용',
        startDate: new Date(Date.now() + 86400000), 
        endDate: new Date(Date.now() + 172800000), 
        options: [{ title: '옵션1' }, { title: '옵션2' }],
      };

      await expect(pollService.createPoll(inputData as any, mockAdmin.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[400] boardType이 "POLL"이 아닌 경우 BadRequestError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      findBoardSpy.mockResolvedValue({ ...mockBoard, boardType: 'Notice' } as any);
      const inputData = {
        boardId: mockBoard.id,
        status: 'PENDING',
        buildingPermission: ['ALL'],
        title: '투표 테스트',
        content: '내용',
        startDate: new Date(Date.now() + 86400000), 
        endDate: new Date(Date.now() + 172800000),
        options: [{ title: '옵션1' }, { title: '옵션2' }],
      };

      await expect(pollService.createPoll(inputData as any, mockAdmin.id)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('[400] 선택지가 2개 미만인 경우 BadRequestError를 던진다', async () => {
      const inputData = {
        boardId: mockBoard.id,
        status: 'PENDING',
        buildingPermission: ['ALL'],
        title: '투표 테스트',
        content: '내용',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        options: [{ title: '옵션1' }],
      };

      findUserSpy.mockResolvedValue(mockAdmin);
      findBoardSpy.mockResolvedValue(mockBoard);

      await expect(pollService.createPoll(inputData as any, mockAdmin.id)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('getPollList 테스트', () => {
    it('[200 / 관리자] 성공적으로 투표 목록을 반환한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      findBoardByApartmentIdSpy.mockResolvedValue(mockBoard);
      getPollListSpy.mockResolvedValue({ polls: mockPoll, totalCount: mockPoll.length });

      const result = await pollService.getPollList(mockQuery, mockAdmin.id);

      expect(result).toHaveProperty('totalCount', 3);
      expect(result.polls).toHaveLength(3);
      expect(result.polls[0]).toHaveProperty('pollId', 'poll1');
      // BE: UPCOMING -> FE: PENDING 상태 변환 확인
      expect(result.polls[0].status).toBe('PENDING');
    });

    it('[200 / 일반 유저] 성공적으로 투표 목록을 반환한다', async () => {
      // 유저1은 101동이므로 MockPoll의 마지막 인덱스 제외하여 테스트
      findUserSpy.mockResolvedValue(mockUser1);
      findBoardByApartmentIdSpy.mockResolvedValue(mockBoard);
      getPollListSpy.mockResolvedValue({ polls: [mockPoll[0], mockPoll[1]], totalCount: 2 });

      const result = await pollService.getPollList(mockQuery, mockUser1.id);

      expect(result).toHaveProperty('totalCount', 2);
      expect(result.polls).toHaveLength(2);

      const callArgs = getPollListSpy.mock.calls[0][0];
      expect(callArgs.buildingPermission).toEqual(['101', 'ALL']);
    });
  });

  describe('getPollDetail 테스트', () => {
    it('[200] 성공적으로 투표 상세 정보를 반환한다', async () => {
      const pollDetail = {
        ...mockPoll[0],
        board: mockBoard,
        pollOptions: [
          { id: 'opt1', content: '옵션1', voteCount: 10 },
          { id: 'opt2', content: '옵션2', voteCount: 5 },
        ],
      };

      findPollSpy.mockResolvedValue(pollDetail);
      findUserSpy.mockResolvedValue(mockUser1);
      getPollAndUpdateViewCountSpy.mockResolvedValue(pollDetail);

      const result = await pollService.getPollDetail('poll1', mockUser1.id);

      expect(result).toHaveProperty('pollId', 'poll1');
      expect(result.options).toHaveLength(2);
      expect(result.options[0]).toHaveProperty('voteCount', 10);
      expect(getPollAndUpdateViewCountSpy).toHaveBeenCalledWith('poll1');
    });

    it('[404] 존재하지 않는 투표인 경우 NotFoundError를 던진다', async () => {
      findPollSpy.mockResolvedValue(null);
      await expect(pollService.getPollDetail('invalid', mockAdmin.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 권한이 없는 동의 유저인 경우 ForbiddenError를 던진다', async () => {
      // 유저1(mockUser1)은 101동이므로 102동 투표는 권한 없음
      const restrictedPoll = {
        ...mockPoll[0],
        board: mockBoard,
        buildingPermission: ['102'],
      };
      findPollSpy.mockResolvedValue(restrictedPoll);
      findUserSpy.mockResolvedValue(mockUser1);

      await expect(pollService.getPollDetail('poll1', mockUser1.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('updatePoll 테스트', () => {
    const updateData = {
      status: 'PENDING',
      buildingPermission: ['ALL'],
      title: '수정된 투표',
      content: '수정된 내용',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      options: [{ title: '옵션1' }, { title: '옵션2' }],
    };

    it('[200] 성공적으로 투표를 수정한다', async () => {
      const mockResult = {
        ...mockPoll[0],
        title: '수정된 투표',
        description: '수정된 내용',
      };
      findPollSpy.mockResolvedValue(mockPoll[0]); // status: UPCOMING
      findUserSpy.mockResolvedValue(mockAdmin);
      updatePollSpy.mockResolvedValue(mockResult);

      const result = await pollService.updatePoll(updateData as any, mockAdmin.id, 'poll1');

      expect(result).toHaveProperty('title', '수정된 투표');
      expect(updatePollSpy).toHaveBeenCalled();
    });

    it('[404] 존재하지 않는 투표인 경우 NotFoundError를 던진다', async () => {
      findPollSpy.mockResolvedValue(null);
      await expect(
        pollService.updatePoll(updateData as any, mockAdmin.id, 'invalid'),
      ).rejects.toThrow(NotFoundError);
    });

    it('[403] 수정 권한이 없는 경우 ForbiddenError를 던진다', async () => {
      findPollSpy.mockResolvedValue(mockPoll[0]);
      findUserSpy.mockResolvedValue(mockUser1);

      await expect(
        pollService.updatePoll(updateData as any, mockUser1.id, 'poll1'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('[400] 투표가 진행중이거나 종료된 경우 BadRequestError를 던진다', async () => {
      findPollSpy.mockResolvedValue(mockPoll[1]);
      findUserSpy.mockResolvedValue(mockAdmin);

      await expect(
        pollService.updatePoll(updateData as any, mockAdmin.id, 'poll2'),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deletePoll 테스트', () => {
    it('[204] 성공적으로 투표를 삭제한다', async () => {
      findPollSpy.mockResolvedValue(mockPoll[0]);
      findUserSpy.mockResolvedValue(mockAdmin);
      deletePollSpy.mockResolvedValue(undefined);

      await pollService.deletePoll('poll1', mockAdmin.id);

      expect(deletePollSpy).toHaveBeenCalledWith('poll1');
    });

    it('[404] 존재하지 않는 투표인 경우 NotFoundError를 던진다', async () => {
      findPollSpy.mockResolvedValue(null);
      await expect(pollService.deletePoll('invalid', mockAdmin.id)).rejects.toThrow(NotFoundError);
    });

    it('[400] 진행중인 투표를 삭제하려 하면 BadRequestError를 던진다', async () => {
      findPollSpy.mockResolvedValue(mockPoll[1]);
      await expect(pollService.deletePoll('poll2', mockAdmin.id)).rejects.toThrow(BadRequestError);
    });
  });
});
