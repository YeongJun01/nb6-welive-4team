import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../user/user.repository';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../../../lib/constants';

// Mock UserRepository
const mockUserRepository = {
  findUserWithDetails: jest.fn(),
  findUserByUnique: jest.fn(),
} as unknown as UserRepository;

// Mock 유저 데이터 (findUserWithDetails가 반환하는 형태)
const mockApprovedUser = {
  id: 'user-1',
  username: 'testuser',
  password: '', // beforeAll에서 해시값으로 설정
  name: '테스트유저',
  email: 'test@test.com',
  contact: '010-1234-5678',
  role: 'ADMIN',
  joinStatus: 'APPROVED',
  apartmentId: 'apt-1',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  apartment: {
    id: 'apt-1',
    name: '테스트아파트',
    boards: [{ boardType: 'COMPLAINT', id: 'board-1' }],
  },
  residentLists: null,
};

const mockPendingUser = {
  ...mockApprovedUser,
  id: 'user-2',
  email: 'pending@test.com',
  joinStatus: 'PENDING',
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    mockApprovedUser.password = await bcrypt.hash('correctPassword', 10);
    mockPendingUser.password = mockApprovedUser.password;
  });

  beforeEach(() => {
    authService = new AuthService(mockUserRepository);
  });

  describe('login', () => {
    it('올바른 이메일과 비밀번호로 로그인하면 토큰을 반환한다', async () => {
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue(mockApprovedUser);

      const result = await authService.login({
        email: 'test@test.com',
        password: 'correctPassword',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.userInfo.email).toBe('test@test.com');
      expect(result.userInfo.role).toBe('ADMIN');
    });

    it('존재하지 않는 이메일로 로그인하면 에러를 던진다', async () => {
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@test.com', password: '1234' }),
      ).rejects.toThrow('이메일 또는 비밀번호가 일치하지 않습니다.');
    });

    it('비밀번호가 틀리면 에러를 던진다', async () => {
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue(mockApprovedUser);

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrongPassword' }),
      ).rejects.toThrow('이메일 또는 비밀번호가 일치하지 않습니다.');
    });

    it('가입 승인이 안 된 유저는 로그인할 수 없다', async () => {
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue(mockPendingUser);

      await expect(
        authService.login({ email: 'pending@test.com', password: 'correctPassword' }),
      ).rejects.toThrow('가입 승인이 완료되지 않은 계정입니다.');
    });
  });

  describe('generateAccessToken', () => {
    it('유효한 JWT 액세스 토큰을 생성한다', () => {
      const token = authService.generateAccessToken('user-1');
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string };

      expect(decoded.userId).toBe('user-1');
    });
  });

  describe('generateRefreshToken', () => {
    it('유효한 JWT 리프레시 토큰을 생성한다', () => {
      const token = authService.generateRefreshToken('user-1');
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };

      expect(decoded.userId).toBe('user-1');
    });
  });

  describe('verifyToken', () => {
    it('유효한 액세스 토큰을 검증한다', () => {
      const token = authService.generateAccessToken('user-1');
      const result = authService.verifyToken(token, 'access');

      expect(result.userId).toBe('user-1');
    });

    it('잘못된 토큰이면 에러를 던진다', () => {
      expect(() => authService.verifyToken('invalid-token', 'access')).toThrow(
        '유효하지 않은 토큰입니다.',
      );
    });
  });
});
