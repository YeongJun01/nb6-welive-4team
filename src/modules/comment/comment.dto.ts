export enum CommentTargetType {
  COMPLAINT = 'COMPLAINT',
  NOTICE = 'NOTICE',
}

export type CreateCommentDto = {
  content: string;
  boardType: CommentTargetType;
  boardId: string; // 해당 게시글의 id
};

export type UpdateCommentDto = {
  content: string;
  boardType: CommentTargetType;
  boardId: string; // 해당 게시글의 id
};

export type BoardDto = {
  id: string;
  boardType: CommentTargetType;
};

export type CommentResponseDto = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  writerName: string;
};

export type CommentResponseWithBoardDto = {
  comment: CommentResponseDto;
  board: BoardDto;
};
