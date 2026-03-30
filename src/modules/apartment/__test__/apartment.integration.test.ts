import apartmentService from '../apartment.service';
import prisma from '../../../lib/prisma';

describe('아파트 통합 테스트', () => {
  // 테스트 db 초기화
  beforeEach(async () => {
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
  // test db 확인
  // console.log(process.env.DATABASE_URL);

  // 아파트 공개 목록 조회
  it('아파트 목록 조회 통합 테스트', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트 아파트',
        address: '서울',
        officeNumber: '0249482674',
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
        users: {
          create: [
            {
              id: 'admin1',
              name: '관리자',
              username: 'test',
              password: '1234',
              contact: '01039483948',
              email: 'test@test.com',
            },
          ],
        },
      },
    });

    const result = await apartmentService.getApartmentsForPublic();

    expect(result.totalCount).toBe(1);
    expect(result.apartments[0].name).toBe('테스트 아파트');
  });

  // 아파트 목록 조회 (관리자)
  it('관리자 아파트 목록 조회 통합 테스트', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트 아파트',
        address: '서울',
        officeNumber: '0249482674',
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
        users: {
          create: [
            {
              id: 'admin1',
              name: '관리자',
              username: 'test',
              password: '1234',
              contact: '01039483948',
              email: 'test@test.com',
              role: 'ADMIN',
            },
          ],
        },
      },
    });

    const result = await apartmentService.getApartmentForAdmin('admin1');

    expect(result.totalCount).toBe(1);
    expect(result.apartments[0].name).toBe('테스트 아파트');
  });

  // 아파트 목록 조회 (슈퍼관리자)
  it('슈퍼관리자 아파트 목록 조회 통합 테스트', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트 아파트',
        address: '서울',
        officeNumber: '0249482674',
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
        users: {
          create: [
            {
              id: 'admin1',
              name: '관리자',
              username: 'test',
              password: '1234',
              contact: '01039483948',
              email: 'test@test.com',
              role: 'ADMIN',
            },
          ],
        },
      },
    });

    const result = await apartmentService.getAllApartmentsForSuperAdmin();

    expect(result.totalCount).toBe(1);
    expect(result.apartments[0].name).toBe('테스트 아파트');
  });

  // 아파트 상세 조회
  it('아파트 상세 조회 통합 테스트', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트',
        address: '서울',
        officeNumber: '0249482674',
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
      },
    });

    const result = await apartmentService.getApartmentByIdForPublic('apt1');

    expect(result?.dongRange.start).toBe('103');
    expect(result?.hoRange.end).toBe('608');
  });

  // 관리자 없을 경우
  it('관리자 아파트 없을 때 빈 배열 반환', async () => {
    const result = await apartmentService.getApartmentForAdmin('no-admin');

    expect(result).toEqual({
      apartments: [],
      totalCount: 0,
    });
  });

  // 공개 조회 아파트가 존재하지 않을 경우
  it('존재하지 않는 아파트 상세 조회', async () => {
    const result = await apartmentService.getApartmentByIdForPublic('no-id');

    expect(result).toBeNull();
  });
});
