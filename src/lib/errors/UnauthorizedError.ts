class UnauthorizedError extends Error {
  status: number;

  constructor(message: string = '인증/인가에 실패했습니다.') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export default UnauthorizedError;
