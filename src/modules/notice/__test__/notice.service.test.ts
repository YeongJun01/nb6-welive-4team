import noticeService from '../notice.service';
import noticeRepository, { userRepo, boardRepo } from '../notice.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../lib/errors';

// [초기 셋팅] 의존 모듈 Mock 처리 : notice, notification
jest.mock('../notice.repository');
jest.mock('../../notification/notification.repository');

describe('Notice Service 단위 테스트', () => {
  // [초기 셋팅] Mock 및 Spy 변수 선언
  let mockAdmin1: any;
  let mockAdmin2: any;
  let mockUser1: any;
  let mockUser2: any;
  let mockBoard: any;
  let mocknotice: any;
  let mockNoticeWithComments: any;
  let mockQuery: any;

  let findUserSpy: jest.SpyInstance;
  let findBoardSpy: jest.SpyInstance;
  let findBoardByApartmentIdSpy: jest.SpyInstance;
  let findNoticeSpy: jest.SpyInstance;

  let createNoticeSpy: jest.SpyInstance;
  let getNoticeListSpy: jest.SpyInstance;
  let getNoticeAndUpdateViewCountSpy: jest.SpyInstance;
  let updateNoticeSpy: jest.SpyInstance;
  let deleteNoticeSpy: jest.SpyInstance;

  // [테스트 셋팅] 테스트용 Mock 데이터 및 Spy 생성
  beforeAll(() => {
    mockAdmin1 = { id: 'admin1', role: 'ADMIN', apartmentId: 'apt1' };
    mockAdmin2 = { id: 'admin2', role: 'ADMIN', apartmentId: 'apt2' };
    mockUser1 = { id: 'user1', role: 'USER', apartmentId: 'apt1' };
    mockUser2 = { id: 'user2', role: 'USER', apartmentId: 'apt2' };
    mockBoard = {
      id: 'noticeBoardId',
      adminId: mockAdmin1.id,
      apartmentId: 'apt1',
      boardType: 'NOTICE',
    };

    mocknotice = [
      {
        id: 'notice1',
        boardId: mockBoard.id,
        adminId: mockAdmin1.id,
        category: 'MAINTENANCE',
        title: '공지사항1',
        content: '내용1',
        isPinned: false,
        viewCount: 10,
        admin: { name: '관리자1' },
        _count: { comments: 2 },
        board: mockBoard,
      },
      {
        id: 'notice2',
        boardId: mockBoard.id,
        adminId: mockAdmin1.id,
        category: 'EMERGENCY',
        title: '공지사항2',
        content: '내용2',
        isPinned: true,
        viewCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        admin: { name: '관리자1' },
        _count: { comments: 0 },
        board: mockBoard,
      },
    ];

    mockNoticeWithComments = {
      ...mocknotice[0],
      content: '상세 내용입니다.',
      startDate: new Date(),
      endDate: new Date(),
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
    findNoticeSpy = jest.spyOn(noticeRepository, 'getNoticeById');

    createNoticeSpy = jest.spyOn(noticeRepository, 'createNotice');
    getNoticeListSpy = jest.spyOn(noticeRepository, 'getNoticeList');
    getNoticeAndUpdateViewCountSpy = jest.spyOn(noticeRepository, 'getNoticeAndUpdateViewCount');
    updateNoticeSpy = jest.spyOn(noticeRepository, 'updateNotice');
    deleteNoticeSpy = jest.spyOn(noticeRepository, 'deleteNotice');
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

  describe('createNotice 테스트', () => {
    it('[200 / 기간 미존재] 성공적으로 공지사항 데이터를 생성한다', async () => {
      const inputData = {
        id: 'notice1',
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '공지사항1',
        content: '내용1',
        isPinned: false,
      };

      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardSpy.mockResolvedValue(mockBoard as any);
      createNoticeSpy.mockResolvedValue({ ...inputData });

      const result = await noticeService.createNotice(inputData as any, mockAdmin1.id);
      expect(result).toHaveProperty('id', 'notice1');

      const createNotice = createNoticeSpy.mock.calls[0][0];
      expect(createNotice.eventData).toBe(false);
    });

    it('[200 / 기간 존재] 성공적으로 공지사항과 함께 이벤트 데이터를 생성한다', async () => {
      const inputData = {
        id: 'notice2',
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '공지사항2',
        content: '내용2',
        isPinned: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      };

      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardSpy.mockResolvedValue(mockBoard as any);
      createNoticeSpy.mockResolvedValue({ ...inputData });

      const result = await noticeService.createNotice(inputData as any, mockAdmin1.id);
      expect(result).toHaveProperty('id', 'notice2');

      const createNotice = createNoticeSpy.mock.calls[0][0];
      expect(createNotice.eventData).toBe(true);
    });

    it('[403] 관리자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1 as any);
      const inputData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };

      await expect(noticeService.createNotice(inputData as any, mockUser1.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('[404] 게시판 정보가 없는 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardSpy.mockResolvedValue(null);
      const inputData = {
        boardId: 'invalid',
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };

      await expect(noticeService.createNotice(inputData as any, mockAdmin1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[400] boardType이 "NOTICE"가 아닌 경우 BadRequestError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardSpy.mockResolvedValue({ ...mockBoard, boardType: 'POLL' } as any);
      const inputData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };

      await expect(noticeService.createNotice(inputData as any, mockAdmin1.id)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('[403] 해당 게시판의 관리자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin2 as any);
      findBoardSpy.mockResolvedValue(mockBoard as any);
      const inputData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };

      await expect(noticeService.createNotice(inputData as any, mockAdmin2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('getNoticeList 테스트', () => {
    it('[200] 성공적으로 공지사항 목록을 반환한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardByApartmentIdSpy.mockResolvedValue(mockBoard as any);
      getNoticeListSpy.mockResolvedValue({ noticeList: mocknotice, totalCount: mocknotice.length });

      const result = await noticeService.getNoticeList(mockQuery, mockAdmin1.id);

      expect(result).toHaveProperty('totalCount', 2);
      expect(result.notices).toHaveLength(2);
      expect(result.notices[0]).toHaveProperty('noticeId', 'notice1');
      expect(result.notices[0]).toHaveProperty('writerName', '관리자1');
      expect(result.notices[0]).toHaveProperty('commentsCount', 2);
    });

    it('[404] 게시판 정보가 없는 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardByApartmentIdSpy.mockResolvedValue(null);

      await expect(noticeService.getNoticeList(mockQuery, mockAdmin1.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getNoticeDetail 테스트', () => {
    it('[200] 성공적으로 공지사항 상세 정보를 반환한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(mocknotice[0] as any);
      getNoticeAndUpdateViewCountSpy.mockResolvedValue(mockNoticeWithComments as any);

      const result = await noticeService.getNoticeDetail('notice1', mockUser1.id);

      expect(result).toHaveProperty('noticeId', 'notice1');
      expect(result).toHaveProperty('writerName', '관리자1');
    });

    it('[404] 공지사항이 존재하지 않으면 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(null);

      await expect(noticeService.getNoticeDetail('invalid', mockAdmin1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 사용자의 소속 아파트와 공지사항의 아파트 아이디가 다르면 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin2 as any); // 아파트가 다름 (apt2)
      findNoticeSpy.mockResolvedValue(mocknotice[0] as any);

      await expect(noticeService.getNoticeDetail('notice1', mockAdmin2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('updateNotice 테스트', () => {
    it('[200 / 기간 미존재] 성공적으로 공지사항 데이터를 수정한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(mocknotice[0]);
      updateNoticeSpy.mockResolvedValue({ ...mocknotice[0], title: '수정된 제목' });

      const updateNoticeData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '수정된 제목',
        content: '내용2',
        isPinned: false,
      };

      const result = await noticeService.updateNotice(
        updateNoticeData as any,
        mocknotice[0].id,
        mockAdmin1.id,
      );

      expect(result).toHaveProperty('noticeId', 'notice1');
      expect(result).toHaveProperty('title', '수정된 제목');

      const updateNoticeEventData = updateNoticeSpy.mock.calls[0][3];
      expect(updateNoticeEventData).toBe(false);
    });

    it('[200 / 기간 존재] 성공적으로 공지사항과 함께 이벤트 데이터를 수정한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(mocknotice[0]);
      updateNoticeSpy.mockResolvedValue({ ...mocknotice[0], title: '수정된 제목' });

      const updateNoticeData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '수정된 제목',
        content: '내용2',
        isPinned: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      };

      const result = await noticeService.updateNotice(
        updateNoticeData as any,
        mocknotice[0].id,
        mockAdmin1.id,
      );

      expect(result).toHaveProperty('noticeId', 'notice1');
      expect(result).toHaveProperty('title', '수정된 제목');

      const updateNoticeEventData = updateNoticeSpy.mock.calls[0][3];
      expect(updateNoticeEventData).toBe(true);
    });

    it('[404] 공지사항이 존재하지 않으면 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(null);
      await expect(noticeService.updateNotice(mockQuery, 'invalid', mockAdmin1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[400] boardId가 다른 경우 BadRequestError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findBoardSpy.mockResolvedValue(mockBoard as any);
      findNoticeSpy.mockResolvedValue(mocknotice[0]);

      const inputData = {
        boardId: 'invalid-id',
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };
      await expect(
        noticeService.updateNotice(inputData as any, mocknotice[0].id, mockAdmin1.id),
      ).rejects.toThrow(BadRequestError);
    });

    it('[403] 수정 권한이 없는 경우(작성자 불일치) ForbiddenError를 던진다', async () => {
      findNoticeSpy.mockResolvedValue(mocknotice[0]);
      findUserSpy.mockResolvedValue(mockAdmin2 as any);

      const inputData = {
        boardId: mockBoard.id,
        category: 'MAINTENANCE',
        title: '제목',
        content: '내용',
      };

      await expect(
        noticeService.updateNotice(inputData as any, mocknotice[0].id, mockAdmin2.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteNotice 테스트', () => {
    it('[204] 성공적으로 공지사항을 삭제한다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin1 as any);
      findNoticeSpy.mockResolvedValue(mocknotice[0] as any);
      deleteNoticeSpy.mockResolvedValue(mocknotice[0] as any);

      const result = await noticeService.deleteNotice('notice1', mockAdmin1.id);

      expect(result).toHaveProperty('id', 'notice1');
      expect(result.deletedAt).not.toBeNull();
    });

    it('[404] 공지사항이 존재하지 않으면 NotFoundError를 던진다', async () => {
      findNoticeSpy.mockResolvedValue(null);
      await expect(noticeService.deleteNotice('invalid', mockAdmin1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 수정 권한이 없는 경우(작성자 불일치) ForbiddenError를 던진다', async () => {
      findNoticeSpy.mockResolvedValue(mocknotice[0]);
      findUserSpy.mockResolvedValue(mockAdmin2 as any);

      await expect(noticeService.deleteNotice('notice1', mockAdmin2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
