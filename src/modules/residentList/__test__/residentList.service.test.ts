import { ResidentListService } from '../residentList.service';
import { ResidentListRepository } from '../residentList.repository';
import { UserRepository } from '../../user';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../lib/errors';
import bcrypt from 'bcrypt';
import { Status, UserType } from '@prisma/client';
import { IsHouseholder } from '../residentList.dto';

describe('ResidentListService', () => {
  let service: ResidentListService;
  let residentRepo: jest.Mocked<ResidentListRepository>;
  let userRepo: jest.Mocked<UserRepository>;

  const hashed = bcrypt.hashSync('1234', 10);

  const mockAdmin = {
    id: 'user-1',
    role: UserType.ADMIN,
    username: 'admin',
    apartmentId: 'apt-1',
    apartmentDong: '101',
    apartmentHo: '1001',
    name: '홍길동',
    contact: '010',
    email: 'test@test.com',
    password: hashed,
    joinStatus: Status.APPROVED,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUser = {
    id: 'user-2',
    role: UserType.USER,
    username: 'user',
    apartmentId: 'apt-2',
    apartmentDong: '102',
    apartmentHo: '1002',
    name: '김동길',
    contact: '010',
    email: 'test2@test.com',
    password: hashed,
    joinStatus: Status.APPROVED,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    residentRepo = {
      getResidentsList: jest.fn(),
      createResident: jest.fn(),
      findDuplicateResident: jest.fn(),
      getResidentById: jest.fn(),
      updateResident: jest.fn(),
      deleteResident: jest.fn(),
      softDeleteResident: jest.fn(),
      createManyResidents: jest.fn(),
      findHouseholdersByAddresses: jest.fn(),
    } as any;

    userRepo = {
      findUserByUnique: jest.fn(),
    } as any;

    service = new ResidentListService(residentRepo, userRepo);
  });

  // getResidentList
  it('입주민 목록 조회 성공', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockAdmin);

    residentRepo.getResidentsList.mockResolvedValue({
      residents: [
        {
          id: 'resident1',
          userId: 'res-1',
          apartmentId: 'apt-1',
          apartmentDong: '101',
          apartmentHo: '1001',
          contact: '010',
          name: '홍길동',
          isRegistered: true,
          isHouseholder: true,
          approvalStatus: 'APPROVED',
          email: 'test@test.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
      totalCount: 1,
    });

    const result = await service.getResidentsList('user-1');

    expect(result.count).toBe(1);
    expect(result.residents[0].building).toBe('101');
    expect(result.residents[0]).toMatchObject({
      building: '101',
      unitNumber: '1001',
      residenceStatus: 'RESIDENCE',
      isHouseholder: 'HOUSEHOLDER',
    });
  });
  it('관리자가 아니면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockUser);

    await expect(service.getResidentsList('user-2')).rejects.toThrow(ForbiddenError);
  });

  it('유저가 없으면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue(null);

    await expect(service.getResidentsList('user-1')).rejects.toThrow(NotFoundError);
  });

  it('apartmentId가 없으면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue({
      ...mockAdmin,
      apartmentId: null,
    });

    await expect(service.getResidentsList('user-1')).rejects.toThrow(NotFoundError);
  });

  // createResidentList
  it('입주민 생성 성공', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockAdmin);

    residentRepo.findDuplicateResident.mockResolvedValue(null);

    // createResident 실행시 해당 명부 생성
    residentRepo.createResident.mockResolvedValue({
      id: 'res-1',
      userId: null,
      apartmentId: 'apt-1',
      apartmentDong: '101',
      apartmentHo: '1001',
      contact: '010',
      name: '홍길동',
      email: 'test@test.com',
      isRegistered: true,
      isHouseholder: false,
      approvalStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    // 입력 값 dto, 형식 검증용 - 실제 입력값이 아님
    const dto = {
      building: '101',
      unitNumber: '1001',
      name: '홍길동',
      contact: '010',
      isHouseholder: IsHouseholder.MEMBER,
    };

    // 실행과 함께 위에 설정해둔 데이터로 명부 생성됨
    const result = await service.createResident('user-1', dto);

    expect(result.name).toBe('홍길동');
    expect(result.building).toBe('101');
    expect(result).toMatchObject({
      building: '101',
      unitNumber: '1001',
      residenceStatus: 'RESIDENCE',
      isHouseholder: 'MEMBER',
    });

    // repo 호출 검증

    expect(residentRepo.createResident).toHaveBeenCalledWith('apt-1', dto);
  });

  it('유저(관리자)가 없으면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue(null);

    // 입력 값 dto, 형식 검증용 - 실제 입력값이 아님
    const dto = {
      building: '101',
      unitNumber: '1001',
      name: '홍길동',
      contact: '010',
      isHouseholder: IsHouseholder.MEMBER,
    };

    await expect(service.createResident('user-1', dto)).rejects.toThrow(NotFoundError);
  });

  it('관리자가 아니면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockUser);

    // 입력 값 dto, 형식 검증용 - 실제 입력값이 아님
    const dto = {
      building: '101',
      unitNumber: '1001',
      name: '홍길동',
      contact: '010',
      isHouseholder: IsHouseholder.MEMBER,
    };

    await expect(service.createResident('user-2', dto)).rejects.toThrow(ForbiddenError);
  });

  it('중복된 입주민이면 에러', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockAdmin);

    // 중복 확인 로직에서 id 걸리도록 설정
    residentRepo.findDuplicateResident.mockResolvedValue({
      id: 'res-1',
    } as any);

    // 입력 값 dto, 형식 검증용 - 실제 입력값이 아님
    const dto = {
      building: '101',
      unitNumber: '1001',
      name: '홍길동',
      contact: '010',
      isHouseholder: IsHouseholder.HOUSEHOLDER,
    };

    // id가 중복으로 걸렸기에 에러
    await expect(service.createResident('user-1', dto)).rejects.toThrow(ConflictError);
  });

  // updateResidentList
  it('입주민 수정 성공', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockAdmin);

    // 기존 입주민 정보
    const existingResident = {
      id: 'res-1',
      userId: null,
      apartmentId: 'apt-1',
      apartmentDong: '101',
      apartmentHo: '1001',
      contact: '010',
      name: '홍길동',
      email: 'test@test.com',
      isRegistered: true,
      isHouseholder: false,
      approvalStatus: Status.APPROVED,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // 수정된 입주민 정보
    const updatedResident = {
      ...existingResident,
      apartmentDong: '102',
      apartmentHo: '1002',
      contact: '011',
      name: '김철수',
      isHouseholder: true,
    };

    residentRepo.getResidentById.mockResolvedValue(existingResident);
    residentRepo.updateResident.mockResolvedValue(updatedResident);

    // 입력 값 dto, 형식 검증용 - 실제 입력값이 아님
    const dto = {
      building: '102',
      unitNumber: '1002',
      name: '김철수',
      contact: '011',
      isHouseholder: IsHouseholder.HOUSEHOLDER,
    };

    const result = await service.updateResident('user-1', 'res-1', dto);

    // repo 호출 검증
    expect(residentRepo.updateResident).toHaveBeenCalledWith('res-1', dto);

    // 수정 값 반영 확인
    expect(result).toMatchObject({
      id: 'res-1',
      building: '102',
      unitNumber: '1002',
      name: '김철수',
      contact: '011',
      residenceStatus: 'RESIDENCE',
      isHouseholder: IsHouseholder.HOUSEHOLDER,
    });

    // 기존 값 유지 확인
    expect(result.approvalStatus).toBe('APPROVED');
    expect(result.createdAt).toEqual(existingResident.createdAt);
  });

  //deleteResidentList
  it('입주민 삭제 성공', async () => {
    userRepo.findUserByUnique.mockResolvedValue(mockAdmin);

    residentRepo.getResidentById.mockResolvedValue({
      id: 'res-1',
    } as any);

    residentRepo.deleteResident.mockResolvedValue({
      id: 'res-1',
    } as any);

    const result = await service.deleteResident('user-1', 'res-1');

    expect(result.message).toContain('삭제');
    expect(residentRepo.deleteResident).toHaveBeenCalledWith('res-1');
  });

  it('유저가 없으면 삭제 실패', async () => {
    userRepo.findUserByUnique.mockResolvedValue(null);

    await expect(service.deleteResident('user-1', 'res-1')).rejects.toThrow(NotFoundError);
  });
});
