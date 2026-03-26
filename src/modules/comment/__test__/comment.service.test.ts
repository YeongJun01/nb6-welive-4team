import { CommentService } from '../comment.service';
import { CommentTargetType } from '../comment.dto';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../lib/errors';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: any;
  let complaintRepository: any;
  let noticeRepository: any;

  beforeEach(() => {
    commentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    complaintRepository = {
      getComplaintById: jest.fn(),
    };

    noticeRepository = {
      getNoticeById: jest.fn(),
    };

    service = new CommentService(commentRepository, complaintRepository, noticeRepository);
  });

  // 편의를 위해 삭제를 제외하고 모두 민원 댓글로만 테스트
  // createComment
  it('댓글 생성 성공 - complaint', async () => {
    complaintRepository.getComplaintById.mockResolvedValue({ id: 'c1' });

    // create 호출시 다음의 데이터 입력
    commentRepository.create.mockResolvedValue({
      id: 'comment-1',
      userId: 'user-1',
      content: '내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: '홍길동' },
    });

    const result = await service.create('user-1', {
      content: '내용',
      boardId: 'c1',
      boardType: CommentTargetType.COMPLAINT,
    });

    // 검증
    expect(result.comment.content).toBe('내용');
    expect(result.board.boardType).toBe(CommentTargetType.COMPLAINT);
    expect(result.board.id).toBe('c1');
    expect(result.comment.writerName).toBe('홍길동');
  });
  it('민원 없으면 에러', async () => {
    complaintRepository.getComplaintById.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        content: '내용',
        boardId: 'c1',
        boardType: CommentTargetType.COMPLAINT,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  // updateComment
  it('댓글 수정 성공', async () => {
    // db에 comment-1이라는 댓글이 있다고 가정하고 반환
    commentRepository.findById.mockResolvedValue({
      id: 'comment-1',
      userId: 'user-1',
      content: '기존 댓글',
    });
    // update 호출시 다음의 데이터 입력
    commentRepository.update.mockResolvedValue({
      id: 'comment-1',
      userId: 'user-1',
      content: '수정됨',
      updatedAt: new Date(),
      user: { name: '홍길동' },
    });

    const result = await service.update('user-1', 'comment-1', {
      content: '수정됨',
      boardId: 'c1',
      boardType: CommentTargetType.COMPLAINT,
    });

    expect(result.comment.content).toBe('수정됨');
    expect(result.board.boardType).toBe(CommentTargetType.COMPLAINT);
    expect(result.board.id).toBe('c1');
    expect(result.comment.writerName).toBe('홍길동');
  });
  it('작성자 아니면 수정 실패', async () => {
    commentRepository.findById.mockResolvedValue({
      id: 'comment-1',
      userId: 'other-user',
    });

    await expect(
      service.update('user-1', 'comment-1', {
        content: '수정',
        boardId: 'c1',
        boardType: CommentTargetType.COMPLAINT,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  // deleteComment
  it('댓글 삭제 성공 - complaint', async () => {
    commentRepository.findById.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'user-1',
    });

    const result = await service.delete('user-1', 'comment-1');

    expect(result.message).toBe('댓글이 정상적으로 삭제되었습니다.');
    expect(commentRepository.delete).toHaveBeenCalled();
  });
  it('댓글 삭제 성공 - notice', async () => {
    commentRepository.findById
      .mockResolvedValueOnce(null) // complaint 없음 - service 파일에서 민원으로 검사 후 없으면 공지로 넘어감
      .mockResolvedValueOnce({
        id: 'comment-1',
        userId: 'user-1',
      });

    const result = await service.delete('user-1', 'comment-1');

    expect(result.message).toBeDefined();
  });
  it('작성자 아니면 삭제 실패', async () => {
    commentRepository.findById.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'other-user',
    });

    await expect(service.delete('user-1', 'comment-1')).rejects.toThrow(ForbiddenError);
  });
});
