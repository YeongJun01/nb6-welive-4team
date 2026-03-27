import voteService from '../vote.service';
import voteRepository from '../vote.repository';
import { userRepo } from '../../poll/poll.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../lib/errors';
import prisma from '../../../lib/prisma';

// [초기 셋팅] 의존 모듈 Mock 처리
jest.mock('../vote.repository');
jest.mock('../../poll/poll.repository');
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: { findUnique: jest.fn() },
  },
}));

describe('Vote Service 단위 테스트', () => {
  // [초기 셋팅] Mock 및 Spy 변수 선언
  let mockUser1: any;
  let mockUser2: any;
  let mockPoll1: any;

  let findUserSpy: jest.SpyInstance;
  let getPollByOptionIdSpy: jest.SpyInstance;
  let checkVoteSpy: jest.SpyInstance;
  let createVoteSpy: jest.SpyInstance;
  let deleteVoteSpy: jest.SpyInstance;
  let updateVoteCountSpy: jest.SpyInstance;

  // [테스트 셋팅] 테스트용 Mock 데이터 및 Spy 생성
  beforeAll(async () => {
    mockUser1 = {
      id: 'user1',
      role: 'USER',
      apartmentId: 'apt1',
      residentLists: {
        apartmentId: 'apt1',
        apartmentDong: '101',
        apartmentHo: '101',
        name: '사용자1',
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
        name: '사용자2',
        approvalStatus: 'APPROVED',
      },
    };

    mockPoll1 = {
      id: 'poll1',
      boardId: 'board1',
      adminId: 'admin1',
      status: 'ONGOING',
      buildingPermission: ['ALL'],
      title: '투표 1',
      description: '내용 1',
      startDate: new Date(2026, 2, 15),
      endDate: new Date(2026, 3, 30),
      board: { apartmentId: 'apt1' },
      pollOptions: [
        {
          id: 'option1-1',
          content: '옵션1-1',
          voteCount: 0,
        },
      ],
    };

    findUserSpy = jest.spyOn(userRepo, 'getUserInfo');
    getPollByOptionIdSpy = jest.spyOn(voteRepository, 'getPollByOptionId');
    checkVoteSpy = jest.spyOn(voteRepository, 'checkVote');
    createVoteSpy = jest.spyOn(voteRepository, 'createVote');
    deleteVoteSpy = jest.spyOn(voteRepository, 'deleteVote');
    updateVoteCountSpy = jest.spyOn(voteRepository, 'updateVoteCount');
  });

  // [테스트 셋팅] 각 테스트 실행 전 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // [테스트 종료] Spy 복원
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('createVote 테스트', () => {
    it('[200] 성공적으로 사용자가 투표를 진행한다', async () => {
      const optionId = mockPoll1.pollOptions[0].id;
      const userId = mockUser1.id;

      const mockPollDetail = {
        ...mockPoll1.pollOptions[0],
        pollId: mockPoll1.id,
        poll: mockPoll1,
      };

      findUserSpy.mockResolvedValue(mockUser1);
      getPollByOptionIdSpy.mockResolvedValue(mockPollDetail);
      checkVoteSpy.mockResolvedValue(null);

      // 트랜잭션 Mock
      (prisma.$transaction as jest.Mock).mockImplementation((cb) => cb(prisma));
      createVoteSpy.mockResolvedValue({ id: 'vote1' });
      updateVoteCountSpy.mockResolvedValue({ ...mockPollDetail, voteCount: 1 });

      const result = await voteService.createVote(optionId, userId);

      expect(result).toHaveProperty('pollId', mockPoll1.id);
      expect(getPollByOptionIdSpy).toHaveBeenCalledWith(optionId);
      expect(createVoteSpy).toHaveBeenCalledWith(mockPoll1.id, optionId, userId, prisma);
      expect(updateVoteCountSpy).toHaveBeenCalledWith(mockPoll1.id, optionId, prisma);
    });

    it('[404] 존재하지 않는 투표(옵션)인 경우 NotFoundError를 던진다', async () => {
      getPollByOptionIdSpy.mockResolvedValue(null);
      await expect(voteService.createVote('invalid', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('[400] 투표가 진행중이 아닌 경우 BadRequestError를 던진다', async () => {
      const upcomingPoll = { ...mockPoll1, status: 'UPCOMING' };
      getPollByOptionIdSpy.mockResolvedValue({ ...mockPoll1.pollOptions[0], poll: upcomingPoll });
      await expect(voteService.createVote('opt1', 'user1')).rejects.toThrow(BadRequestError);
    });

    it('[403] 이미 투표한 경우 BadRequestError를 던진다', async () => {
      const mockPollDetail = { ...mockPoll1.pollOptions[0], pollId: mockPoll1.id, poll: mockPoll1 };
      getPollByOptionIdSpy.mockResolvedValue(mockPollDetail);
      findUserSpy.mockResolvedValue(mockUser1);
      checkVoteSpy.mockResolvedValue({ id: 'existingVote' });

      await expect(voteService.createVote('opt1', 'user1')).rejects.toThrow(BadRequestError);
    });

    it('[403] 해당 동은 투표 권한이 없는 경우 ForbiddenError를 던진다', async () => {
      const restrictedPoll = { ...mockPoll1, buildingPermission: ['101'] };
      const mockPollDetail = {
        ...mockPoll1.pollOptions[0],
        pollId: mockPoll1.id,
        poll: restrictedPoll,
      };
      getPollByOptionIdSpy.mockResolvedValue(mockPollDetail);
      findUserSpy.mockResolvedValue(mockUser2);

      await expect(voteService.createVote('opt1', 'user2')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteVote 테스트', () => {
    it('[204] 성공적으로 투표를 취소한다', async () => {
      const optionId = mockPoll1.pollOptions[0].id;
      const userId = mockUser1.id;

      const mockPollDetail = {
        ...mockPoll1.pollOptions[0],
        pollId: mockPoll1.id,
        poll: mockPoll1,
      };

      findUserSpy.mockResolvedValue(mockUser1);
      getPollByOptionIdSpy.mockResolvedValue(mockPollDetail);
      checkVoteSpy.mockResolvedValue({ id: 'existingVote' });
      (prisma.$transaction as jest.Mock).mockImplementation((cb) => cb(prisma));
      deleteVoteSpy.mockResolvedValue({ id: 'existingVote' });
      updateVoteCountSpy.mockResolvedValue({ ...mockPollDetail, voteCount: 0 });

      const result = await voteService.deleteVote(optionId, userId);

      expect(result).toHaveProperty('pollId', mockPoll1.id);
      expect(deleteVoteSpy).toHaveBeenCalledWith(mockPoll1.id, userId, prisma);
    });

    it('[400] 투표하지 않은 사용자가 취소를 시도하면 BadRequestError를 던진다', async () => {
      const mockPollDetail = { ...mockPoll1.pollOptions[0], pollId: mockPoll1.id, poll: mockPoll1 };
      getPollByOptionIdSpy.mockResolvedValue(mockPollDetail);
      findUserSpy.mockResolvedValue(mockUser1);
      checkVoteSpy.mockResolvedValue(null);

      await expect(voteService.deleteVote('opt1', 'user1')).rejects.toThrow(BadRequestError);
    });
  });
});
