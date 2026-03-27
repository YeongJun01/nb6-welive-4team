import request from 'supertest';
import app from '../../../app';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { NoticeType, Status } from '@prisma/client';

describe('댓글 api 테스트', () => {
  let complaint: any;
  let notice: any;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // DB 초기화
    await prisma.notification.deleteMany();
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    const hashed = await bcrypt.hash('1234', 10);

    // 일반 유저
    const user = await prisma.user.create({
      data: {
        id: 'user-1',
        email: 'test@test.com',
        password: hashed,
        name: '홍길동',
        username: 'test',
        contact: '01087654321',
        role: 'USER',
        joinStatus: 'APPROVED',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        id: 'user-2',
        email: 'test2@test.com',
        password: hashed,
        name: '김철수',
        username: 'test2',
        contact: '01012345678',
        role: 'USER',
        joinStatus: 'APPROVED',
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
        contact: '01056781234',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
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
    // 민원 생성
    complaint = await prisma.complaint.create({
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
    // 공지 생성
    notice = await prisma.notice.create({
      data: {
        id: 'n1',
        title: '공지',
        content: '내용',
        adminId: 'admin-1',
        boardId: 'notice1',
        category: NoticeType.COMMUNITY,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 댓글 생성 성공 - 민원
  it('댓글 생성 성공 - 민원', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    // 결과 검증
    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('댓글');
    expect(res.body.comment.writerName).toBe('홍길동');
    expect(res.body.board.id).toBe(complaint.id);
    expect(res.body.board.boardType).toBe('COMPLAINT');

    const comments = await prisma.complaintComment.findMany();
    expect(comments.length).toBe(1);
  });

  // 댓글 생성 성공 - 공지
  it('댓글 생성 성공 - 공지', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: notice.id,
        boardType: 'NOTICE',
      });

    // 결과 검증
    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('댓글');
    expect(res.body.comment.writerName).toBe('홍길동');
    expect(res.body.board.id).toBe(notice.id);
    expect(res.body.board.boardType).toBe('NOTICE');

    const comments = await prisma.noticeComment.findMany();
    expect(comments.length).toBe(1);
  });

  // 생성 실패 케이스 - 민원
  it('댓글 생성 실패 - 민원 게시글 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];
    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: '없는 id',
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('민원을 찾을 수 없습니다.');
  });

  // 댓글 생성 실패 케이스 - 공지
  it('댓글 생성 실패 - 공지 게시글 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];
    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: '없는 id',
        boardType: 'NOTICE',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('공지를 찾을 수 없습니다.');
  });

  // 댓글 생성 실패 케이스 - 잘못된 게시글 타입
  it('댓글 생성 실패 - 해당 게시판 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];
    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: '없는 id',
        boardType: 'POLL',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('잘못된 게시글 타입입니다.');
  });

  // 댓글 생성 실패 케이스 - 내용 없음
  it('댓글 생성 실패 - 내용 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];
    // 댓글 생성 api
    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '   ',
        boardId: 'c1',
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('내용을 입력해주세요.');
  });

  // 댓글 수정 성공 - 민원
  it('댓글 수정 성공 - 민원', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    // 댓글 수정 api
    const res = await request(app)
      .patch(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '수정됨',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(200);
    expect(res.body.comment.content).toBe('수정됨');
    expect(res.body.comment.writerName).toBe('홍길동');
    expect(res.body.board.id).toBe(complaint.id);
  });

  // 댓글 수정 성공 - 공지
  it('댓글 수정 성공 - 공지', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: notice.id,
        boardType: 'NOTICE',
      });

    // 댓글 수정 api
    const res = await request(app)
      .patch(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '수정됨',
        boardId: notice.id,
        boardType: 'NOTICE',
      });

    expect(res.status).toBe(200);
    expect(res.body.comment.content).toBe('수정됨');
    expect(res.body.comment.writerName).toBe('홍길동');
    expect(res.body.board.id).toBe(notice.id);
  });

  // 댓글 수정 실패 - 작성자 아님
  it('댓글 수정 실패 - 작성자 아님', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    // 다른 일반 유저 로그인해서 토큰 받기
    const login2 = await request(app).post('/auth/login').send({
      email: 'test2@test.com',
      password: '1234',
    });

    // 다른 유저의 토큰 업데이트
    userToken = login2.header.authorization.split(' ')[1];

    // 댓글 수정 api
    const res = await request(app)
      .patch(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '수정됨',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('본인만 수정할 수 있습니다.');
  });

  // 댓글 수정 실패 - 댓글 없음
  it('댓글 수정 실패 - 댓글 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 댓글 수정 api - 실패기 때문에 생성 없이 바로 수정 시도
    const res = await request(app)
      .patch('/comments/없는id')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '수정',
        boardId: 'c1',
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('댓글을 찾을 수 없습니다.');
  });

  // 댓글 수정 실패 - 내용 없음
  it('댓글 수정 실패 - 내용 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 기존 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: 'c1',
        boardType: 'COMPLAINT',
      });

    // 댓글 내용 없이 수정 시도
    const res = await request(app)
      .patch(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '   ',
        boardId: 'c1',
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('내용을 입력해주세요.');
  });

  // 댓글 삭제 성공 - 민원
  it('댓글 삭제 성공 - 민원', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    // 댓글 삭제
    const res = await request(app)
      .delete(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('댓글이 정상적으로 삭제되었습니다.');

    const comments = await prisma.complaintComment.findMany();
    expect(comments.length).toBe(0);
  });

  // 댓글 삭제 성공 - 공지
  it('댓글 삭제 성공 - 공지', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: notice.id,
        boardType: 'NOTICE',
      });

    // 댓글 삭제
    const res = await request(app)
      .delete(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('댓글이 정상적으로 삭제되었습니다.');

    const comments = await prisma.noticeComment.findMany();
    expect(comments.length).toBe(0);
  });

  // 댓글 삭제 실패 - 댓글 없음
  it('댓글 삭제 실패 - 댓글 없음', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 댓글 삭제
    const res = await request(app)
      .delete('/comments/없는id')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('댓글을 찾을 수 없습니다.');
  });

  // 댓글 삭제 실패 - 작성자 아님
  it('댓글 삭제 실패 - 작성자 아님', async () => {
    // 일반 유저 로그인해서 토큰 받기
    const login = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    userToken = login.header.authorization.split(' ')[1];

    // 먼저 댓글 생성
    const comment = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '댓글',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    // 다른 일반 유저 로그인해서 토큰 받기
    const login2 = await request(app).post('/auth/login').send({
      email: 'test2@test.com',
      password: '1234',
    });

    // 다른 유저의 토큰 업데이트
    userToken = login2.header.authorization.split(' ')[1];

    // 댓글 수정 api
    const res = await request(app)
      .delete(`/comments/${comment.body.comment.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '수정됨',
        boardId: complaint.id,
        boardType: 'COMPLAINT',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('삭제 권한이 없습니다.');
  });
});
