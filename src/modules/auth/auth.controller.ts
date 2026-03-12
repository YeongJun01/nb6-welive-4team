import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';
import { UnauthorizedError } from '../../lib/errors';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response) {
    const loginDto: LoginDto = req.body;
    const { accessToken, refreshToken } = await this.authService.login(loginDto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: '로그인 성공', accessToken });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('리프레시 토큰이 없습니다.');
    }

    const { userId } = this.authService.verifyToken(refreshToken, 'refresh');
    const accessToken = this.authService.generateAccessToken(userId);

    res.status(200).json({ message: '리프레시 성공', accessToken });
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.status(200).json({ message: '로그아웃 성공' });
  }
}
