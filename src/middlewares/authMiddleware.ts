import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../lib/constants';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch {
    throw new UnauthorizedError('유효하지 않은 토큰입니다.');
  }
}
