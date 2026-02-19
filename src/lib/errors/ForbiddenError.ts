// lib/errors/ForbiddenError.js
class ForbiddenError extends Error {
  status: number;

  constructor(message: string = '권한이 없습니다.') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

export default ForbiddenError;
