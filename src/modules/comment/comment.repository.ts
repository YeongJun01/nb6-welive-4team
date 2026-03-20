import { PrismaClient } from '@prisma/client';
import { CreateCommentDto, CommentTargetType, UpdateCommentDto } from './comment.dto';
import { BadRequestError } from '../../lib/errors';

export class CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // 댓글 생성
  async create(userId: string, data: CreateCommentDto) {
    switch (data.boardType) {
      case CommentTargetType.COMPLAINT:
        return this.prisma.complaintComment.create({
          data: {
            userId,
            complaintId: data.boardId,
            content: data.content,
          },
          include: {
            user: {
              select: { name: true },
            },
          },
        });

      case CommentTargetType.NOTICE:
        return this.prisma.noticeComment.create({
          data: {
            userId,
            noticeId: data.boardId,
            content: data.content,
          },
          include: {
            user: {
              select: { name: true },
            },
          },
        });

      default:
        throw new BadRequestError('댓글을 남길 수 없습니다.');
    }
  }

  // 댓글 수정
  async update(commentId: string, data: UpdateCommentDto) {
    switch (data.boardType) {
      case CommentTargetType.COMPLAINT:
        return this.prisma.complaintComment.update({
          where: { id: commentId },
          data: {
            content: data.content,
          },
          include: {
            user: {
              select: { name: true },
            },
          },
        });
      case CommentTargetType.NOTICE:
        return this.prisma.noticeComment.update({
          where: { id: commentId },
          data: {
            content: data.content,
          },
          include: {
            user: {
              select: { name: true },
            },
          },
        });
      default:
        throw new BadRequestError('댓글을 수정할 수 없습니다.');
    }
  }

  // 댓글 삭제
  async delete(commentId: string, boardType: CommentTargetType) {
    switch (boardType) {
      case CommentTargetType.COMPLAINT:
        return this.prisma.complaintComment.delete({
          where: { id: commentId },
        });
      case CommentTargetType.NOTICE:
        return this.prisma.noticeComment.delete({
          where: { id: commentId },
        });
      default:
        throw new BadRequestError('댓글을 삭제할 수 없습니다.');
    }
  }

  // 댓글 조회
  async findById(commentId: string, boardType: CommentTargetType) {
    switch (boardType) {
      case CommentTargetType.COMPLAINT:
        return this.prisma.complaintComment.findUnique({
          where: { id: commentId },
        });

      case CommentTargetType.NOTICE:
        return this.prisma.noticeComment.findUnique({
          where: { id: commentId },
        });

      default:
        throw new BadRequestError('댓글 조회 실패');
    }
  }
}
