class BadRequestError extends Error {
  status: number;

  constructor(message: string = '잘못된 요청입니다.') {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

export default BadRequestError;
