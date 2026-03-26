import { ResidentListService } from '../residentList.service';
import { ResidentListRepository } from '../residentList.repository';
import { UserRepository } from '../../user';
import prisma from '../../../lib/prisma';
import { IsHouseholder } from '../residentList.dto';

// 파일 파싱 자체는 믿고 결과만 테스트
jest.mock('../parseCsv');

// 파일 삭제 방지
jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));
import * as csvModule from '../parseCsv';
import { BadRequestError } from '../../../lib/errors';

describe('ResidentList 통합 테스트', () => {
  let service: ResidentListService;
  let residentRepo: ResidentListRepository;
  let userRepo: UserRepository;

  let adminUser: any;

  beforeEach(async () => {
    residentRepo = new ResidentListRepository(prisma);
    userRepo = new UserRepository(prisma);
    service = new ResidentListService(residentRepo, userRepo);

    // DB 초기화
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();

    // 아파트 생성
    await prisma.apartment.create({
      data: {
        id: 'apt-1',
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
      },
    });

    // 관리자 생성
    adminUser = await prisma.user.create({
      data: {
        id: 'admin-1',
        username: 'admin',
        role: 'ADMIN',
        apartmentId: 'apt-1',
        name: '관리자',
        contact: '010',
        email: 'admin@test.com',
        password: 'hashed',
        joinStatus: 'APPROVED',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // createResident
  it('입주민 생성 통합 테스트', async () => {
    // 입력 값
    const dto = {
      building: '101',
      unitNumber: '1002',
      name: '홍길동',
      contact: '010',
      isHouseholder: IsHouseholder.HOUSEHOLDER,
    };

    const result = await service.createResident(adminUser.id, dto);

    expect(result.name).toBe('홍길동');

    // DB 직접 검증
    const saved = await prisma.residentList.findFirst({
      where: {
        name: '홍길동',
      },
    });

    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('홍길동');
    expect(saved!.apartmentId).toBe('apt-1');
    expect(saved!.apartmentDong).toBe('101');
  });

  // getResidentList
  it('입주민 목록 조회 통합 테스트', async () => {
    await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: true,
      },
    });

    const result = await service.getResidentsList(adminUser.id);

    expect(result.count).toBe(1);
    expect(result.residents[0].name).toBe('홍길동');
  });

  // updateResidentList
  it('입주민 수정 통합 테스트', async () => {
    // 수정 전 기존 입주민 정보 생성
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: false,
      },
    });

    // 수정할 입주민 정보 생성
    const updatedResident = {
      building: '102',
      unitNumber: '1002',
      name: '김철수',
      contact: '011',
      isHouseholder: IsHouseholder.HOUSEHOLDER,
    };

    // 수정
    await service.updateResident(adminUser.id, resident.id, updatedResident);

    // 처음 만들때의 id로 입주민 확인
    const updated = await prisma.residentList.findUnique({
      where: { id: resident.id },
    });

    expect(updated).not.toBeNull();
    expect(updated!.apartmentId).toBe('apt-1');
    expect(updated!.name).toBe('김철수');
    expect(updated!.apartmentDong).toBe('102');
  });

  // deleteResidentList
  it('입주민 삭제 통합 테스트', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: false,
      },
    });

    await service.deleteResident(adminUser.id, resident.id);

    const deleted = await prisma.residentList.findUnique({
      where: { id: resident.id },
    });

    expect(deleted).toBeNull();
  });

  // csv로 입주자 생성
  it('CSV로 입주민 생성 성공', async () => {
    (csvModule.parseCsv as jest.Mock).mockResolvedValue([
      {
        동: '101',
        호수: '1001',
        이름: '홍길동',
        연락처: '010',
        세대주여부: 'HOUSEHOLDER',
      },
      {
        동: '101',
        호수: '1001',
        이름: '김철수',
        연락처: '011',
        세대주여부: 'MEMBER',
      },
    ]);

    const result = await service.createResidentsByCsv(adminUser.id, {
      path: 'fake-path.csv',
    } as any);

    expect(result.count).toBe(2);

    // DB 검증
    const residents = await prisma.residentList.findMany();

    expect(residents.length).toBe(2);
    expect(residents[0].apartmentDong).toBe('101');
  });
  it('CSV 내부 세대주 중복이면 에러', async () => {
    (csvModule.parseCsv as jest.Mock).mockResolvedValue([
      {
        동: '101',
        호수: '1001',
        이름: '홍길동',
        세대주여부: 'HOUSEHOLDER',
      },
      {
        동: '101',
        호수: '1001',
        이름: '김철수',
        세대주여부: 'HOUSEHOLDER',
      },
    ]);

    await expect(
      service.createResidentsByCsv(adminUser.id, {
        path: 'fake-path.csv',
      } as any),
    ).rejects.toThrow(BadRequestError);
  });
  it('기존 DB에 세대주가 있으면 에러', async () => {
    // 기존 세대주 미리 생성
    await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '기존세대주',
        contact: '010',
        isHouseholder: true,
      },
    });

    (csvModule.parseCsv as jest.Mock).mockResolvedValue([
      {
        동: '101',
        호수: '1001',
        이름: '홍길동',
        세대주여부: 'HOUSEHOLDER',
      },
    ]);

    await expect(
      service.createResidentsByCsv(adminUser.id, {
        path: 'fake-path.csv',
      } as any),
    ).rejects.toThrow(BadRequestError);
  });
});
