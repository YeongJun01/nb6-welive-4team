import { Request, Response } from 'express';
import { CommentService } from './';
import { BadRequestError } from '../../lib/errors';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 댓글 생성
  async create(req: Request, res: Response) {
    const userId = req.user!.id;
    const data = req.body;
    const comment = await this.commentService.create(userId, data);
    res.status(201).json(comment);
  }

  // 댓글 수정
  async update(req: Request, res: Response) {
    const userId = req.user!.id;
    const commentId = req.params.id;
    if (Array.isArray(commentId)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    const comment = await this.commentService.update(userId, commentId, req.body);
    res.status(200).json(comment);
  }

  // 댓글 삭제
  async delete(req: Request, res: Response) {
    const userId = req.user!.id;
    const commentId = req.params.id;

    if (Array.isArray(commentId)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    const comment = await this.commentService.delete(userId, commentId);
    res.status(200).json(comment);
  }
}
