import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { ResidentListRepository } from '../../residentList/residentList.repository';
import { ResidentListService } from '../../residentList/residentList.service';
import { NotificationRepository } from '../../notification/notification.repository';

// Mock 의존성
const mockUserRepository = {
  findUserByUnique: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  findApartmentById: jest.fn(),
  findUsersByRole: jest.fn(),
  findAdminsByApartmentId: jest.fn(),
} as unknown as UserRepository;

const mockResidentListRepository = {
  findResidentByUnique: jest.fn(),
  createResidentFromSignUp: jest.fn(),
  updateResidentUserId: jest.fn(),
} as unknown as ResidentListRepository;

const mockResidentListService = {
  createResidentFromSignUp: jest.fn(),
} as unknown as ResidentListService;

const mockNotificationRepository = {
  createNotification: jest.fn(),
} as unknown as NotificationRepository;

// prisma mock (아파트 생성용)
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    apartment: {
      create: jest.fn().mockResolvedValue({ id: 'new-apt-1' }),
    },
  },
}));

jest.mock('../../../lib/socket', () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
  }),
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(
      mockUserRepository,
      mockResidentListRepository,
      mockResidentListService,
      mockNotificationRepository,
    );
  });

  describe('signUp', () => {
    const signUpData = {
      username: 'testuser',
      password: 'test1234',
      name: '테스트유저',
      email: 'test@test.com',
      contact: '010-1234-5678',
      role: 'USER' as const,
      apartmentId: 'apt-1',
      apartmentDong: '101',
      apartmentHo: '501',
    };

    it('정상적으로 회원가입이 완료된다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findApartmentById as jest.Mock).mockResolvedValue({ id: 'apt-1' });
      (mockResidentListRepository.findResidentByUnique as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findAdminsByApartmentId as jest.Mock).mockResolvedValue([]);
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        ...signUpData,
        password: 'hashed',
        joinStatus: 'PENDING',
      });

      const result = await userService.signUp(signUpData);

      expect(result.id).toBe('new-user-1');
      expect(result.email).toBe('test@test.com');
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    it('이메일이 중복이면 ConflictError를 던진다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing',
        email: 'test@test.com',
      });

      await expect(userService.signUp(signUpData)).rejects.toThrow('이미 가입된 이메일입니다.');
    });

    it('연락처가 중복이면 ConflictError를 던진다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email 체크 통과
        .mockResolvedValueOnce({ id: 'existing', contact: '010-1234-5678' }); // contact 중복

      await expect(userService.signUp(signUpData)).rejects.toThrow('이미 가입된 연락처입니다.');
    });
  });

  describe('updatePassword', () => {
    it('비밀번호를 정상적으로 변경한다', async () => {
      const hashedPassword = await bcrypt.hash('currentPw', 10);
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: hashedPassword,
      });
      (mockUserRepository.updateUser as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: '테스트',
      });

      const result = await userService.updatePassword('user-1', {
        currentPassword: 'currentPw',
        newPassword: 'newPw1234',
      });

      expect(mockUserRepository.updateUser).toHaveBeenCalled();
      expect(result.name).toBe('테스트');
    });

    it('현재 비밀번호가 틀리면 에러를 던진다', async () => {
      const hashedPassword = await bcrypt.hash('correctPw', 10);
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: hashedPassword,
      });

      await expect(
        userService.updatePassword('user-1', {
          currentPassword: 'wrongPw',
          newPassword: 'newPw1234',
        }),
      ).rejects.toThrow('현재 비밀번호가 일치하지 않습니다.');
    });

    it('존재하지 않는 유저면 에러를 던진다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updatePassword('user-999', {
          currentPassword: 'any',
          newPassword: 'any',
        }),
      ).rejects.toThrow('해당 사용자가 없습니다.');
    });
  });

  describe('updateUserJoinStatus', () => {
    it('관리자가 입주민 가입을 승인한다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
      });
      (mockUserRepository as any).updateUserJoinStatus = jest.fn().mockResolvedValue({
        id: 'user-1',
        joinStatus: 'APPROVED',
      });

      // updateUserJoinStatus가 repository에 있어야 하므로 직접 추가
      const mockRepo = mockUserRepository as any;
      mockRepo.updateUserJoinStatus = jest.fn().mockResolvedValue({
        id: 'user-1',
        joinStatus: 'APPROVED',
      });

      const service = new UserService(
        mockRepo,
        mockResidentListRepository,
        mockResidentListService,
        mockNotificationRepository,
      );

      const result = await service.updateUserJoinStatus('admin-1', 'user-1', 'APPROVED' as any, 'USER');

      expect(result.joinStatus).toBe('APPROVED');
    });

    it('권한이 없으면 ForbiddenError를 던진다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'USER',
      });

      await expect(
        userService.updateUserJoinStatus('user-1', 'user-2', 'APPROVED' as any, 'USER'),
      ).rejects.toThrow('권한이 없습니다.');
    });
  });
});
