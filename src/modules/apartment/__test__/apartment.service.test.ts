import apartmentService from '../apartment.service';
import apartmentRepository from '../apartment.repository';

jest.mock('../apartment.repository');
// 유닛 테스트
describe('apartmentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // getApartmentsForPublic 공개 목록 조회
  it('공개 아파트 목록 조회 성공', async () => {
    const mockData = [
      {
        id: '1',
        name: '아파트1',
        address: '서울',
      },
    ];

    (apartmentRepository.getApartments as jest.Mock).mockResolvedValue(mockData);

    const result = await apartmentService.getApartmentsForPublic();

    expect(result).toEqual({
      apartments: [
        {
          id: '1',
          name: '아파트1',
          address: '서울',
        },
      ],
      totalCount: 1,
    });
  });

  it('공개 아파트 목록 조회 - 빈 배열', async () => {
    (apartmentRepository.getApartments as jest.Mock).mockResolvedValue([]);

    const result = await apartmentService.getApartmentsForPublic();

    expect(result.totalCount).toBe(0);
    expect(result.apartments).toEqual([]);
  });

  // 아파트 목록 조회 (슈퍼관리자)
  it('슈퍼관리자 아파트 목록 조회 성공', async () => {
    const mockData = [
      {
        id: '1',
        name: '아파트1',
        address: '서울',
        officeNumber: '02-1234',
        description: '설명',
        startComplexNumber: 1,
        endComplexNumber: 2,
        startBuildingNumber: 3,
        endBuildingNumber: 4,
        startFloorNumber: 5,
        endFloorNumber: 6,
        startUnitNumber: 7,
        endUnitNumber: 8,
        apartmentStatus: 'APPROVED',
        users: [
          {
            id: 'admin1',
            name: '관리자',
            contact: '010',
            email: 'test@test.com',
          },
        ],
      },
    ];

    (apartmentRepository.getApartments as jest.Mock).mockResolvedValue(mockData);

    const result = await apartmentService.getAllApartmentsForSuperAdmin();

    expect(result.apartments[0]).toEqual({
      id: '1',
      name: '아파트1',
      address: '서울',
      officeNumber: '02-1234',
      description: '설명',
      startComplexNumber: '01',
      endComplexNumber: '02',
      startDongNumber: '03',
      endDongNumber: '04',
      startFloorNumber: '05',
      endFloorNumber: '06',
      startHoNumber: '07',
      endHoNumber: '08',
      apartmentStatus: 'APPROVED',
      adminId: 'admin1',
      adminName: '관리자',
      adminContact: '010',
      adminEmail: 'test@test.com',
    });

    expect(result.totalCount).toBe(1);
  });

  // 아파트 목록 조회 (관리자)
  it('관리자 아파트 조회 성공', async () => {
    const mockData = {
      id: '1',
      name: '아파트1',
      address: '서울',
      officeNumber: '02',
      description: '설명',
      startComplexNumber: 1,
      endComplexNumber: 1,
      startBuildingNumber: 1,
      endBuildingNumber: 1,
      startFloorNumber: 1,
      endFloorNumber: 1,
      startUnitNumber: 1,
      endUnitNumber: 1,
      apartmentStatus: 'APPROVED',
      users: [{ id: 'admin1', name: '관리자', contact: '010', email: 'a@test.com' }],
    };

    (apartmentRepository.getApartmentByAdminId as jest.Mock).mockResolvedValue(mockData);

    const result = await apartmentService.getApartmentForAdmin('admin1');

    expect(result.totalCount).toBe(1);
  });

  // 공개 아파트 상세 조회
  it('id 없으면 null 반환', async () => {
    const result = await apartmentService.getApartmentByIdForPublic('');

    expect(result).toBeNull();
  });

  it('아파트 없으면 null', async () => {
    (apartmentRepository.getApartmentById as jest.Mock).mockResolvedValue(null);

    const result = await apartmentService.getApartmentByIdForPublic('1');

    expect(result).toBeNull();
  });

  it('아파트 상세 조회 성공 (public)', async () => {
    const mockData = {
      id: '1',
      name: '아파트',
      address: '서울',
      startComplexNumber: 1,
      endComplexNumber: 2,
      startBuildingNumber: 3,
      endBuildingNumber: 4,
      startFloorNumber: 5,
      endFloorNumber: 6,
      startUnitNumber: 7,
      endUnitNumber: 8,
    };

    (apartmentRepository.getApartmentById as jest.Mock).mockResolvedValue(mockData);

    const result = await apartmentService.getApartmentByIdForPublic('1');

    expect(result?.dongRange).toEqual({
      start: '103',
      end: '204',
    });

    expect(result?.hoRange).toEqual({
      start: '507',
      end: '608',
    });
  });

  // 아파트 상세 조회 (관리자)
  it('아파트 상세 조회 성공 (admin)', async () => {
    const mockData = {
      id: '1',
      name: '아파트',
      address: '서울',
      officeNumber: '02',
      description: '설명',
      startComplexNumber: 1,
      endComplexNumber: 1,
      startBuildingNumber: 1,
      endBuildingNumber: 1,
      startFloorNumber: 1,
      endFloorNumber: 1,
      startUnitNumber: 1,
      endUnitNumber: 1,
      apartmentStatus: 'APPROVED',
      users: [{ id: 'admin1', name: '관리자', contact: '010', email: 'a@test.com' }],
    };

    (apartmentRepository.getApartmentById as jest.Mock).mockResolvedValue(mockData);

    const result = await apartmentService.getApartmentByIdForAdmin('1');

    expect(result?.adminId).toBe('admin1');
  });
});
