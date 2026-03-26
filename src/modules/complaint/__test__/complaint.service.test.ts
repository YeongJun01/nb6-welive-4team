import complaintService from '../complaint.service';
import complaintRepository, { userRepo, boardRepo } from '../complaint.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../lib/errors';

// [초기 셋팅] 의존 모듈 Mock 처리 : complaint, notification
jest.mock('../complaint.repository');
jest.mock('../../notification/notification.service');

describe('Complaint Service 단위 테스트', () => {
  // [초기 셋팅] Mock 및 Spy 변수 선언
  let mockAdmin: any;
  let mockUser1: any;
  let mockUser2: any;
  let mockBoard: any;
  let mockComplaint: any;
  let mockComplaintWithComments: any;
  let mockQuery: any;

  let findUserSpy: jest.SpyInstance;
  let findBoardSpy: jest.SpyInstance;
  let findBoardByApartmentIdSpy: jest.SpyInstance;
  let findComplaintSpy: jest.SpyInstance;

  let createComplaintSpy: jest.SpyInstance;
  let getComplaintListSpy: jest.SpyInstance;
  let getComplaintAndUpdateViewCountSpy: jest.SpyInstance;
  let updateComplaintSpy: jest.SpyInstance;
  let updateComplaintStatusSpy: jest.SpyInstance;
  let deleteComplaintSpy: jest.SpyInstance;

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
        contact: '01087654321complaint',
        name: '사용자1 complaint',
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
        contact: '01087654321complaint',
        name: '사용자2 complaint',
        approvalStatus: 'APPROVED',
      },
    };
    mockBoard = {
      id: 'complaintBoardId',
      adminId: mockAdmin.id,
      apartmentId: 'apt1',
      boardType: 'COMPLAINT',
    };

    mockComplaint = [
      {
        id: 'complaint1',
        boardId: mockBoard.id,
        creatorId: mockUser1.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        apartmentDong: '101',
        apartmentHo: '101',
        status: 'PENDING',
        viewCount: 10,
        creator: { name: '사용자1' },
        _count: { comments: 2 },
        board: mockBoard,
      },
      {
        id: 'complaint2',
        boardId: mockBoard.id,
        creatorId: mockUser1.id,
        adminId: mockAdmin.id,
        title: '민원2',
        content: '내용2',
        isPublic: true,
        apartmentDong: '101',
        apartmentHo: '101',
        status: 'PENDING',
        viewCount: 5,
        creator: { name: '사용자1' },
        _count: { comments: 0 },
        board: mockBoard,
      },
    ];

    mockComplaintWithComments = {
      ...mockComplaint[0],
      content: '상세 내용입니다.',
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
    findBoardByApartmentIdSpy = jest.spyOn(boardRepo, 'getBoardByApartmentId');
    findComplaintSpy = jest.spyOn(complaintRepository, 'getComplaintById');

    createComplaintSpy = jest.spyOn(complaintRepository, 'createComplaint');
    getComplaintListSpy = jest.spyOn(complaintRepository, 'getComplaintList');
    getComplaintAndUpdateViewCountSpy = jest.spyOn(
      complaintRepository,
      'getComplaintAndUpdateViewCount',
    );
    updateComplaintSpy = jest.spyOn(complaintRepository, 'updateComplaint');
    updateComplaintStatusSpy = jest.spyOn(complaintRepository, 'updateComplaintStatus');
    deleteComplaintSpy = jest.spyOn(complaintRepository, 'deleteComplaint');
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

  describe('createComplaint 테스트', () => {
    it('[201] 성공적으로 민원을 생성한다', async () => {
      const inputData = {
        id: 'complaint1',
        boardId: mockBoard.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        status: 'PENDING',
      };

      findUserSpy.mockResolvedValue(mockUser1);
      findBoardSpy.mockResolvedValue(mockBoard);
      createComplaintSpy.mockResolvedValue(mockComplaint[0]);

      const result = await complaintService.createComplaint(inputData as any, mockUser1.id);
      expect(result).toHaveProperty('id', 'complaint1');
    });

    it('[403] 사용자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      const inputData = {
        id: 'complaint1',
        boardId: mockBoard.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        status: 'PENDING',
      };

      await expect(
        complaintService.createComplaint(inputData as any, mockAdmin.id),
      ).rejects.toThrow(ForbiddenError);
    });

    it('[404] 게시판 정보가 없는 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findBoardSpy.mockResolvedValue(null);
      const inputData = {
        id: 'complaint1',
        boardId: mockBoard.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        status: 'PENDING',
      };

      await expect(
        complaintService.createComplaint(inputData as any, mockUser1.id),
      ).rejects.toThrow(NotFoundError);
    });

    it('[400] boardType이 "NOTICE"가 아닌 경우 BadRequestError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findBoardSpy.mockResolvedValue({ ...mockBoard, boardType: 'POLL' } as any);
      const inputData = {
        id: 'complaint1',
        boardId: mockBoard.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        status: 'PENDING',
      };

      await expect(
        complaintService.createComplaint(inputData as any, mockUser1.id),
      ).rejects.toThrow(BadRequestError);
    });

    it('[403] 사용자의 아파트와 Board의 아파트가 일치하지 않는 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser2);
      findBoardSpy.mockResolvedValue(mockBoard);
      const inputData = {
        id: 'complaint1',
        boardId: mockBoard.id,
        adminId: mockAdmin.id,
        title: '민원1',
        content: '내용1',
        isPublic: false,
        status: 'PENDING',
      };

      await expect(
        complaintService.createComplaint(inputData as any, mockUser2.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getComplaintList 테스트', () => {
    it('[200] 성공적으로 민원 목록을 조회한다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findBoardByApartmentIdSpy.mockResolvedValue(mockBoard);
      getComplaintListSpy.mockResolvedValue({
        complaintList: mockComplaint,
        totalCount: mockComplaint.length,
      });

      const result = await complaintService.getComplaintList(mockQuery, mockUser1.id);

      expect(result.totalCount).toBe(mockComplaint.length);
      expect(result.complaints[0].complaintId).toBe('complaint1');
      expect(result.complaints[0].writerName).toBe('사용자1');
    });

    it('[403] 자신과 다른 동/호수의 민원은 조회할 수 없다', async () => {
      findUserSpy.mockResolvedValue(mockUser2);
      findBoardByApartmentIdSpy.mockResolvedValue(mockBoard);

      // 사용자의 동(102)과 다른 쿼리(101)를 요청하여 에러 유도
      const invalidQuery = { ...mockQuery, dong: '101' };

      await expect(complaintService.getComplaintList(invalidQuery, mockUser2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('getComplaintDetail 테스트', () => {
    it('[200] 성공적으로 민원을 조회하고 조회수를 증가시킨다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);
      getComplaintAndUpdateViewCountSpy.mockResolvedValue(mockComplaintWithComments);

      const result = await complaintService.getComplaintDetail('complaint1', mockUser1.id);

      expect(result).toHaveProperty('complaintId', 'complaint1');
      expect(result).toHaveProperty('content', '상세 내용입니다.');
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].writerName).toBe('사용자1');
      expect(getComplaintAndUpdateViewCountSpy).toHaveBeenCalledWith('complaint1');
    });

    it('[404] 존재하지 않는 민원인 경우 NotFoundError를 던진다', async () => {
      findComplaintSpy.mockResolvedValue(null);
      await expect(complaintService.getComplaintDetail('none', mockUser1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 비공개 민원을 조회하려는 경우 작성자가 아니면 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser2);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);

      await expect(complaintService.getComplaintDetail('complaint1', mockUser2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('updateComplaint 테스트', () => {
    it('[200] 성공적으로 민원을 수정한다', async () => {
      const updateData = { title: '수정된 제목', content: '수정된 내용', isPublic: true };
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);
      updateComplaintSpy.mockResolvedValue({ ...mockComplaint[0], ...updateData });

      const result = await complaintService.updateComplaint('complaint1', updateData, mockUser1.id);

      expect(result.title).toBe('수정된 제목');
      expect(updateComplaintSpy).toHaveBeenCalledWith('complaint1', updateData);
    });

    it('[404] 존재하지 않는 민원인 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue(null);

      await expect(
        complaintService.updateComplaint(
          'complaint1',
          { title: 'a', content: 'a', isPublic: true },
          mockUser1.id,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('[403] 작성자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser2);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);

      await expect(
        complaintService.updateComplaint(
          'complaint1',
          { title: 'a', content: 'a', isPublic: true },
          mockUser2.id,
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('[403] PENDING 상태가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue({ ...mockComplaint[0], status: 'IN_PROGRESS' });

      await expect(
        complaintService.updateComplaint(
          'complaint1',
          { title: 'a', content: 'a', isPublic: true },
          mockUser1.id,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateComplaintStatus 테스트', () => {
    it('[200] 성공적으로 민원 상태를 변경한다', async () => {
      const statusData = { status: 'IN_PROGRESS' };
      findUserSpy.mockResolvedValue(mockAdmin);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);
      updateComplaintStatusSpy.mockResolvedValue({ ...mockComplaint[0], status: 'IN_PROGRESS' });

      const result = await complaintService.updateComplaintStatus(
        'complaint1',
        statusData as any,
        mockAdmin.id,
      );

      expect(result.status).toBe('IN_PROGRESS');
      expect(updateComplaintStatusSpy).toHaveBeenCalledWith('complaint1', statusData);
    });

    it('[404] 존재하지 않는 민원인 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      findComplaintSpy.mockResolvedValue(null);

      await expect(
        complaintService.updateComplaintStatus(
          'complaint1',
          { status: 'RESOLVED' } as any,
          mockAdmin.id,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('[403] 담당 관리자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue({ ...mockAdmin, id: 'otherAdmin' });
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);

      await expect(
        complaintService.updateComplaintStatus(
          'complaint1',
          { status: 'RESOLVED' } as any,
          'otherAdmin',
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteComplaint 테스트', () => {
    it('[204] 성공적으로 민원을 삭제한다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);
      deleteComplaintSpy.mockResolvedValue(undefined);

      await complaintService.deleteComplaint('complaint1', mockUser1.id);

      expect(deleteComplaintSpy).toHaveBeenCalledWith('complaint1', mockUser1.id);
    });

    it('[404] 존재하지 않는 민원인 경우 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockAdmin);
      findComplaintSpy.mockResolvedValue(null);

      await expect(complaintService.deleteComplaint('complaint1', mockUser1.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 처리 중인 민원을 삭제 시도 시 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser1);
      findComplaintSpy.mockResolvedValue({ ...mockComplaint[0], status: 'RESOLVED' });

      await expect(complaintService.deleteComplaint('complaint1', mockUser1.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('[403] 작성자가 아닌 경우 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue(mockUser2);
      findComplaintSpy.mockResolvedValue(mockComplaint[0]);

      await expect(complaintService.deleteComplaint('complaint1', mockUser2.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
