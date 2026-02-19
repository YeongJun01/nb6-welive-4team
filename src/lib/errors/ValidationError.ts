class ValidationError extends Error {
  status: number;

  constructor(message: string = '입력값이 없습니다.') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export default ValidationError;
