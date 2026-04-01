import request from 'supertest';
import express from 'express';
import * as bcrypt from 'bcrypt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserController } from '../../user/user.controller';
import { UserService } from '../../user/user.service';
import { UserRepository } from '../../user/user.repository';
import { errorHandler } from '../../../middlewares/errorHandler';

// Mock 의존성
const mockUserRepository = {
  findUserWithDetails: jest.fn(),
  findUserByUnique: jest.fn(),
  createUser: jest.fn(),
  findApartmentById: jest.fn(),
  findUsersByRole: jest.fn(),
  findAdminsByApartmentId: jest.fn(),
  findApartmentByName: jest.fn(),
} as unknown as UserRepository;

const mockResidentListRepository = {
  findResidentByUnique: jest.fn().mockResolvedValue(null),
  createResidentFromSignUp: jest.fn(),
  updateResidentUserId: jest.fn(),
} as any;

const mockResidentListService = {
  createResidentFromSignUp: jest.fn(),
} as any;

const mockNotificationRepository = {
  createNotification: jest.fn(),
} as any;

// prisma mock
jest.mock('../../../lib/prisma', () => ({ __esModule: true, default: {} }));
jest.mock('../../../lib/socket', () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());

  const authService = new AuthService(mockUserRepository);
  const authController = new AuthController(authService);
  const userService = new UserService(
    mockUserRepository,
    mockResidentListRepository,
    mockResidentListService,
    mockNotificationRepository,
  );
  const userController = new UserController(userService);

  app.post('/auth/login', async (req, res, next) => {
    try {
      await authController.login(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post('/auth/signup', async (req, res, next) => {
    try {
      await userController.signUpUser(req, res);
    } catch (e) {
      next(e);
    }
  });
  app.post('/auth/logout', async (req, res, next) => {
    try {
      await authController.logout(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.use(errorHandler);

  return app;
}

describe('Auth API 엔드포인트', () => {
  const app = createTestApp();

  describe('POST /auth/login', () => {
    it('올바른 정보로 로그인하면 200과 토큰을 반환한다', async () => {
      const hashedPassword = await bcrypt.hash('test1234', 10);
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        password: hashedPassword,
        name: '테스트',
        email: 'test@test.com',
        contact: '010-1234-5678',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: 'apt-1',
        avatar: null,
        apartment: { name: '테스트아파트', boards: [] },
        residentLists: null,
      });

      const res = await request(app).post('/auth/login').send({
        email: 'test@test.com',
        password: 'test1234',
      });

      expect(res.status).toBe(200);
      expect(res.headers['authorization']).toContain('Bearer ');
      expect(res.body.email).toBe('test@test.com');
    });

    it('잘못된 이메일로 로그인하면 401을 반환한다', async () => {
      (mockUserRepository.findUserWithDetails as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/auth/login').send({
        email: 'wrong@test.com',
        password: 'test1234',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/signup', () => {
    it('입주민 회원가입 성공 시 201을 반환한다', async () => {
      // 기본 UserRepository mocks
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findApartmentByName as jest.Mock).mockResolvedValue({ id: 'apt-1' });
      (mockUserRepository.findApartmentById as jest.Mock).mockResolvedValue({ id: 'apt-1' });
      (mockUserRepository.findAdminsByApartmentId as jest.Mock).mockResolvedValue([]);
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        name: '신규유저',
        email: 'new@test.com',
        joinStatus: 'PENDING',
        role: 'USER',
        apartmentId: 'apt-1',
      });

      // ResidentListRepository mocks
      (mockResidentListRepository.findResidentByUnique as jest.Mock).mockResolvedValue(null); // 신규 유저 → approved 아님
      (mockResidentListRepository.updateResidentUserId as jest.Mock).mockResolvedValue(null);

      // ResidentListService mocks
      (mockResidentListService.createResidentFromSignUp as jest.Mock).mockResolvedValue(null);

      // 실제 요청
      const res = await request(app).post('/auth/signup').send({
        username: 'newuser',
        password: 'test1234',
        name: '신규유저',
        email: 'new@test.com',
        contact: '010-9999-9999',
        apartmentName: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '501',
      });

      // 검증
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('신규유저');
      expect(res.body.role).toBe('USER');
    });

    it('이메일이 중복이면 409를 반환한다', async () => {
      (mockUserRepository.findUserByUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing',
        email: 'dup@test.com',
      });

      const res = await request(app).post('/auth/signup').send({
        username: 'dupuser',
        password: 'test1234',
        name: '중복유저',
        email: 'dup@test.com',
        contact: '010-8888-8888',
        apartmentName: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '501',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/logout', () => {
    it('로그아웃 시 200을 반환한다', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.status).toBe(200);
    });
  });
});
