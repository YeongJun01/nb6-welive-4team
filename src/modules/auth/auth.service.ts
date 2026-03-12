import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginDto } from './auth.dto';
import { UserRepository } from '../user/user.repository';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../../lib/constants';
import { UnauthorizedError } from '../../lib/errors';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(loginDto: LoginDto) {
    // 1. 이메일로 유저 조회 (apartment, boards, residentList 포함)
    const user = await this.userRepository.findUserWithDetails({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    // 3. 가입 승인 상태 확인
    if (user.joinStatus !== 'APPROVED') {
      throw new UnauthorizedError('가입 승인이 완료되지 않은 계정입니다.');
    }

    // 4. 토큰 생성
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // 5. boardIds 가공
    const boardIds: Record<string, string> = {};
    if (user.apartment?.boards) {
      for (const board of user.apartment.boards) {
        boardIds[board.boardType] = board.id;
      }
    }

    // 6. 응답 데이터 가공
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      joinStatus: user.joinStatus,
      apartmentId: user.apartmentId,
      apartmentName: user.apartment?.name ?? null,
      residentDong: user.residentLists?.apartmentDong ?? null,
      boardIds,
      username: user.username,
      contact: user.contact,
      avatar: user.avatar,
    };

    return { accessToken, refreshToken, userInfo };
  }

  generateAccessToken(userId: User['id']) {
    return jwt.sign({ userId }, JWT_ACCESS_SECRET, {
      expiresIn: '1h',
    });
  }

  generateRefreshToken(userId: User['id']) {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string, type: 'access' | 'refresh') {
    const secret = type === 'access' ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET;
    try {
      return jwt.verify(token, secret) as { userId: string };
    } catch {
      throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }
  }
}
