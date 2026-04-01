import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../lib/constants';
import { UnauthorizedError } from '../lib/errors';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // SSE 등 헤더를 보낼 수 없는 경우를 위해 쿼리 파라미터(?token=...) 지원
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string;

  if (!authHeader && !queryToken) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }

  const token = authHeader ? authHeader.split(' ')[1] : queryToken;

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch {
    throw new UnauthorizedError('유효하지 않은 토큰입니다.');
  }
}
