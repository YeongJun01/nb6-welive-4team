import prisma from '../../../lib/prisma';
import { CommentService } from '../comment.service';
import { CommentRepository } from '../comment.repository';
import ComplaintRepository from '../../complaint/complaint.repository';
import NoticeRepository from '../../notice/notice.repository';
import { CommentTargetType } from '../comment.dto';
import bcrypt from 'bcrypt';
import { NoticeType } from '@prisma/client';
import { ForbiddenError } from '../../../lib/errors';

describe('Comment 통합 테스트', () => {
  let service: CommentService;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    const commentRepository = new CommentRepository(prisma);

    service = new CommentService(commentRepository, ComplaintRepository, NoticeRepository);
    const hashed = await bcrypt.hash('1234', 10);

    // 일반 유저
    const user = await prisma.user.create({
      data: {
        id: 'user-1',
        email: 'test@test.com',
        password: hashed,
        name: '홍길동',
        username: 'test',
        contact: '010-1234-5678',
        role: 'USER',
      },
    });

    // 관리자
    const admin = await prisma.user.create({
      data: {
        id: 'admin-1',
        email: 'admin@test.com',
        password: hashed,
        name: '관리자',
        username: 'admin',
        contact: '010-5678-1234',
        role: 'ADMIN',
      },
    });

    // 아파트
    const apartment = await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트',
        address: '서울',
        officeNumber: '010',
        description: '설명',
        startComplexNumber: 1,
        endComplexNumber: 1,
        startBuildingNumber: 1,
        endBuildingNumber: 1,
        startFloorNumber: 1,
        endFloorNumber: 1,
        startUnitNumber: 1,
        endUnitNumber: 1,
        apartmentStatus: 'APPROVED',
      },
    });

    // 아파트에 있는 2개의 게시판 (민원, 공지만 댓글 가능)
    const board1 = await prisma.board.create({
      data: {
        id: 'complaint1',
        adminId: 'admin-1',
        apartmentId: 'apt1',
        boardType: 'COMPLAINT',
      },
    });
    const board2 = await prisma.board.create({
      data: {
        id: 'notice1',
        adminId: 'admin-1',
        apartmentId: 'apt1',
        boardType: 'NOTICE',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 댓글 생성 성공 - 민원

  it('댓글 생성 성공 - complaint', async () => {
    // 댓글을 생성할 민원 생성
    const complaint = await prisma.complaint.create({
      data: {
        id: 'c1',
        title: '민원',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'complaint1',
        creatorId: 'user-1',
        apartmentDong: '101',
        apartmentHo: '101',
      },
    });

    // 생성해둔 민원 게시글에 일반 유저로 댓글 생성
    const result = await service.create('user-1', {
      content: '댓글',
      boardId: complaint.id,
      boardType: CommentTargetType.COMPLAINT,
    });

    expect(result.comment.content).toBe('댓글');
    expect(result.comment.writerName).toBe('홍길동');
    expect(result.board.id).toBe(complaint.id);
    expect(result.board.boardType).toBe(CommentTargetType.COMPLAINT);

    const comments = await prisma.complaintComment.findMany();
    expect(comments.length).toBe(1);
  });

  // 댓글 생성 성공 - 공지
  it('댓글 생성 성공 - notice', async () => {
    // 댓글을 생성할 공지 생성
    const notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });

    // 생성한 공지에 일반 유저로 댓글 생성
    const result = await service.create('user-1', {
      content: '댓글',
      boardId: notice.id,
      boardType: CommentTargetType.NOTICE,
    });

    expect(result.comment.content).toBe('댓글');
    expect(result.comment.writerName).toBe('홍길동');
    expect(result.board.id).toBe(notice.id);
    expect(result.board.boardType).toBe(CommentTargetType.NOTICE);

    const comments = await prisma.noticeComment.findMany();
    expect(comments.length).toBe(1);
  });

  // 댓글 수정 성공 - 민원
  it('댓글 수정 성공 - complaint', async () => {
    // 댓글을 생성할 민원 생성
    const complaint = await prisma.complaint.create({
      data: {
        id: 'c1',
        title: '민원',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'complaint1',
        creatorId: 'user-1',
        apartmentDong: '101',
        apartmentHo: '101',
      },
    });
    // 일반 유저로 기존 댓글 생성
    const comment = await prisma.complaintComment.create({
      data: {
        content: '기존 댓글',
        userId: 'user-1',
        complaintId: complaint.id,
      },
    });

    // 기존 댓글 수정
    const result = await service.update('user-1', comment.id, {
      content: '수정됨',
      boardId: complaint.id,
      boardType: CommentTargetType.COMPLAINT,
    });

    expect(result.comment.content).toBe('수정됨');
    expect(result.comment.writerName).toBe('홍길동');
    expect(result.board.id).toBe(complaint.id);
  });

  // 댓글 수정 - 공지
  it('댓글 수정 성공 - notice', async () => {
    // 댓글을 생성할 공지 생성
    const notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });
    // 생성한 공지에 일반 유저로 댓글 생성
    const result = await service.create('user-1', {
      content: '댓글',
      boardId: notice.id,
      boardType: CommentTargetType.NOTICE,
    });

    // 기존 댓글 수정
    const updated = await service.update('user-1', result.comment.id, {
      content: '수정됨',
      boardId: notice.id,
      boardType: CommentTargetType.NOTICE,
    });

    expect(updated.comment.content).toBe('수정됨');
    expect(updated.comment.writerName).toBe('홍길동');
    expect(updated.board.id).toBe(notice.id);
  });

  // 작성자가 아니면 수정 불가 - 민원
  it('작성자 아니면 수정 실패', async () => {
    const user2 = await prisma.user.create({
      data: {
        id: 'user-2',
        email: 'test2@test.com',
        password: 'hashed',
        name: '김철수',
        username: 'test2',
        contact: '01039483839',
        role: 'USER',
        joinStatus: 'APPROVED',
      },
    });

    // 민원 생성
    const complaint = await prisma.complaint.create({
      data: {
        id: 'c1',
        title: '민원',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'complaint1',
        creatorId: 'user-1',
        apartmentDong: '101',
        apartmentHo: '101',
      },
    });

    // 생성된 민원에 댓글 생성
    const comment = await prisma.complaintComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        complaintId: complaint.id,
      },
    });

    // ForbiddenError 반환
    await expect(
      service.update('user-2', comment.id, {
        content: '수정',
        boardId: complaint.id,
        boardType: CommentTargetType.COMPLAINT,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  // 작성자 아니면 수정 불가 - 공지
  it('본인이 아닐경우 삭제 불가 - 공지', async () => {
    const user2 = await prisma.user.create({
      data: {
        id: 'user-2',
        email: 'test2@test.com',
        password: 'hashed',
        name: '김철수',
        username: 'test2',
        contact: '010458563419',
        role: 'USER',
        joinStatus: 'APPROVED',
      },
    });

    // 공지 생성
    const notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });

    // 생성된 공지에 댓글
    const comment = await prisma.noticeComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        noticeId: notice.id,
      },
    });

    // ForbiddenError 반환
    await expect(
      service.update('user-2', comment.id, {
        content: '수정',
        boardId: notice.id,
        boardType: CommentTargetType.NOTICE,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  // 댓글 삭제 - 민원
  it('댓글 삭제 성공 - complaint', async () => {
    const complaint = await prisma.complaint.create({
      data: {
        id: 'c1',
        title: '민원',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'complaint1',
        creatorId: 'user-1',
        apartmentDong: '101',
        apartmentHo: '101',
      },
    });

    const comment = await prisma.complaintComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        complaintId: complaint.id,
      },
    });

    const result = await service.delete('user-1', comment.id);

    const deleted = await prisma.complaintComment.findUnique({
      where: { id: comment.id },
    });

    expect(result.message).toBe('댓글이 정상적으로 삭제되었습니다.');
    expect(deleted).toBeNull();
  });

  // 댓글 삭제 성공 - 공지
  it('댓글 삭제 성공 - notice', async () => {
    const notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });

    const comment = await prisma.noticeComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        noticeId: notice.id,
      },
    });

    const result = await service.delete('user-1', comment.id);

    const deleted = await prisma.noticeComment.findUnique({
      where: { id: comment.id },
    });

    expect(result.message).toBe('댓글이 정상적으로 삭제되었습니다.');
    expect(deleted).toBeNull();
  });

  // 본인이 아닐경우 삭제 불가 - 민원
  it('본인이 아닐경우 삭제 불가 - 민원', async () => {
    const user2 = await prisma.user.create({
      data: {
        id: 'user-2',
        email: 'test2@test.com',
        password: 'hashed',
        name: '김철수',
        username: 'test2',
        contact: '010458563429',
        role: 'USER',
        joinStatus: 'APPROVED',
      },
    });

    // 민원 생성
    const complaint = await prisma.complaint.create({
      data: {
        id: 'c1',
        title: '민원',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'complaint1',
        creatorId: 'user-1',
        apartmentDong: '101',
        apartmentHo: '101',
      },
    });

    // 생성된 민원에 댓글 생성
    const comment = await prisma.complaintComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        complaintId: complaint.id,
      },
    });
    // ForbiddenError 반환
    await expect(service.delete('user-2', comment.id)).rejects.toThrow(ForbiddenError);
  });

  // 본인이 아닐경우 삭제 불가 - 공지
  it('본인이 아닐경우 삭제 불가 - 공지', async () => {
    const user2 = await prisma.user.create({
      data: {
        id: 'user-2',
        email: 'test2@test.com',
        password: 'hashed',
        name: '김철수',
        username: 'test2',
        contact: '010458563419',
        role: 'USER',
        joinStatus: 'APPROVED',
      },
    });

    // 공지 생성
    const notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });

    // 생성된 공지에 댓글
    const comment = await prisma.noticeComment.create({
      data: {
        content: '댓글',
        userId: 'user-1',
        noticeId: notice.id,
      },
    });

    // ForbiddenError 반환
    await expect(service.delete('user-2', comment.id)).rejects.toThrow(ForbiddenError);
  });
});
