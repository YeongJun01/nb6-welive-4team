import eventService from '../event.service';
import apartmentRepository from '../../apartment/apartment.repository';
import eventRepository from '../event.repository';
import { UserRepository } from '../../user/user.repository';
import { NotFoundError, ForbiddenError } from '../../../lib/errors';

// [초기 셋팅] 의존 모듈 Mock 처리 : user, apartment, event
jest.mock('../../user/user.repository');
jest.mock('../../apartment/apartment.repository');
jest.mock('../event.repository');

describe('Event Service 단위 테스트', () => {
  // [초기 셋팅] Mock 및 Spy 변수 선언
  let mockApartment: any;
  let mockUser: any;
  let mockQuery: any;
  let findUserSpy: jest.SpyInstance;
  let findApartmentSpy: jest.SpyInstance;

  // [테스트 셋팅] 테스트용 Mock 데이터 및 Spy 생성
  beforeAll(() => {
    mockApartment = { id: 'apt-1', name: '테스트 아파트' };
    mockUser = { id: 'user-1', apartmentId: mockApartment.id };
    mockQuery = { apartmentId: mockApartment.id, year: 2026, month: 4 };

    findUserSpy = jest.spyOn(UserRepository.prototype, 'findUserByUnique');
    findApartmentSpy = jest.spyOn(apartmentRepository, 'getApartmentById');
  });

  // [테스트 셋팅] 각 테스트 실행 전 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // [테스트 종료] Spy 복원
  afterAll(() => {
    findUserSpy.mockRestore();
    findApartmentSpy.mockRestore();
  });

  describe('getEventList 테스트', () => {
    it('[200]모든 조건이 충족되면 가공된 이벤트 목록을 반환한다', async () => {
      const mockEvents = [
        {
          id: 'ev-1',
          title: '4월 점검',
          pollId: null,
          notice: {
            startDate: new Date('2026-04-15'),
            endDate: new Date('2026-04-16'),
            category: 'MAINTENANCE',
          },
        },
      ];

      findUserSpy.mockResolvedValue(mockUser as any);
      findApartmentSpy.mockResolvedValue(mockApartment as any);
      (eventRepository.findEventListByApartmentId as jest.Mock).mockResolvedValue(mockEvents);

      const result = await eventService.getEventList(mockQuery, mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('4월 점검');
    });

    it('[404] 사용자가 존재하지 않으면 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue(null);

      await expect(eventService.getEventList(mockQuery, mockUser.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[404] 아파트 정보가 존재하지 않으면 NotFoundError를 던진다', async () => {
      findUserSpy.mockResolvedValue({ id: mockUser.id, apartmentId: mockApartment.id } as any);
      findApartmentSpy.mockResolvedValue(null);

      await expect(eventService.getEventList(mockQuery, mockUser.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('[403] 사용자의 아파트 ID와 쿼리의 아파트 ID가 다르면 ForbiddenError를 던진다', async () => {
      findUserSpy.mockResolvedValue({ id: mockUser.id, apartmentId: 'notMatch' } as any);
      findApartmentSpy.mockResolvedValue({ id: mockApartment.id } as any);

      await expect(eventService.getEventList(mockQuery, mockUser.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
