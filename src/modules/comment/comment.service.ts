import { CommentRepository } from './';
import ComplaintRepository from '../complaint/complaint.repository';
import NoticeRepository from '../notice/notice.repository';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentTargetType,
  CommentResponseWithBoardDto,
} from './comment.dto';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors';

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly complaintRepository: typeof ComplaintRepository,
    private readonly noticeRepository: typeof NoticeRepository,
  ) {}

  // 댓글 생성
  async create(userId: string, data: CreateCommentDto) {
    if (!data.content.trim()) {
      throw new BadRequestError('내용을 입력해주세요.');
    }
    // 게시글 존재 확인
    switch (data.boardType) {
      case CommentTargetType.COMPLAINT:
        const complaint = await this.complaintRepository.getComplaintById(data.boardId);
        if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');
        break;

      case CommentTargetType.NOTICE:
        const notice = await this.noticeRepository.getNoticeById(data.boardId);
        if (!notice) throw new NotFoundError('공지를 찾을 수 없습니다.');
        break;
      default:
        throw new BadRequestError('잘못된 게시글 타입입니다.');
    }
    // 댓글 생성
    const created = await this.commentRepository.create(userId, data);

    return {
      comment: {
        id: created.id,
        userId: created.userId,
        content: created.content,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        writerName: created.user.name,
      },
      board: {
        id: data.boardId,
        boardType: data.boardType,
      },
    } satisfies CommentResponseWithBoardDto;
  }

  // 댓글 수정
  async update(userId: string, commentId: string, data: UpdateCommentDto) {
    if (!data.content.trim()) {
      throw new BadRequestError('내용을 입력해주세요.');
    }
    const comment = await this.commentRepository.findById(commentId, data.boardType);

    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('본인만 수정할 수 있습니다.');
    }
    const updated = await this.commentRepository.update(commentId, data);

    return {
      comment: {
        id: updated.id,
        userId: updated.userId,
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        writerName: updated.user.name,
      },
      board: {
        id: data.boardId,
        boardType: data.boardType,
      },
    } satisfies CommentResponseWithBoardDto;
  }

  // 댓글 삭제
  async delete(userId: string, commentId: string) {
    // 1. complaint에서 찾기
    let comment = await this.commentRepository.findById(commentId, CommentTargetType.COMPLAINT);

    let boardType = CommentTargetType.COMPLAINT;

    // 2. 없으면 notice에서 찾기
    if (!comment) {
      comment = await this.commentRepository.findById(commentId, CommentTargetType.NOTICE);
      boardType = CommentTargetType.NOTICE;
    }

    // 3. 둘 다 없으면 에러
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 4. 작성자 검증
    if (comment.userId !== userId) {
      throw new ForbiddenError('삭제 권한이 없습니다.');
    }

    // 5. 삭제
    await this.commentRepository.delete(commentId, boardType);

    return {
      message: '댓글이 정상적으로 삭제되었습니다.',
    };
  }
}
