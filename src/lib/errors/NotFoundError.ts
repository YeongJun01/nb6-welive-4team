class NotFoundError extends Error {
  status: number;

  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export default NotFoundError;
