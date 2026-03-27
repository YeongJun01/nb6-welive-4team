import request from 'supertest';
import prisma from '../../../lib/prisma';
import app from '../../../app';
import * as bcrypt from 'bcrypt';

describe('Event API 통합 테스트', () => {
  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자용 변수 선언
  const userAgent1 = request.agent(app);
  const userAgent2 = request.agent(app);
  let testApartment1: any;
  let testApartment2: any;
  let testAdmin: any;
  let testUser1: any;
  let testUser2: any;
  let testBoard: any;
  let testNotice: any;

  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자 데이터 생성
  beforeAll(async () => {
    // 0. 기존 잔여 데이터 청소 (이전 테스트 실패 대비)
    await prisma.notification.deleteMany();
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    // 1. 테스트용 아파트 생성
    testApartment1 = await prisma.apartment.create({
      data: {
        name: '테스트 아파트 event',
        address: '서울시 강남구 event',
        officeNumber: '021234567event',
        description: '테스트용 아파트입니다 event',
        endComplexNumber: 1,
        endBuildingNumber: 1,
        endFloorNumber: 1,
        endUnitNumber: 1,
        apartmentStatus: 'APPROVED',
      },
    });

    testApartment2 = await prisma.apartment.create({
      data: {
        name: '테스트 아파트2 event',
        address: '서울시 강남구2 event',
        officeNumber: '021234568event',
        description: '테스트용 아파트입니다2 event',
        endComplexNumber: 1,
        endBuildingNumber: 1,
        endFloorNumber: 1,
        endUnitNumber: 1,
        apartmentStatus: 'APPROVED',
      },
    });

    // 2. 테스트용 사용자 & 관리자 생성
    const hashedPassword = await bcrypt.hash('test1234', 10);
    testAdmin = await prisma.user.create({
      data: {
        username: 'testadminEvent',
        password: hashedPassword,
        name: '관리자 event',
        email: 'adminEvent@test.com',
        contact: '01012345678event',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: testApartment1.id,
      },
    });

    testUser1 = await prisma.user.create({
      data: {
        username: 'testuser1Event',
        password: hashedPassword,
        name: '사용자1 event',
        email: 'user1Event@test.com',
        contact: '01087654321event',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment1.id,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        username: 'testuser2Event',
        password: hashedPassword,
        name: '사용자2 event',
        email: 'user2Event@test.com',
        contact: '01087654322event',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment2.id,
      },
    });

    // 3. 테스트 데이터(게시판, 공지사항, 이벤트) 준비
    testBoard = await prisma.board.create({
      data: {
        adminId: testAdmin.id,
        apartmentId: testApartment1.id,
        boardType: 'NOTICE',
      },
    });

    testNotice = await prisma.notice.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        category: 'MAINTENANCE',
        title: '4월 점검 공지',
        content: '내용',
        startDate: new Date(2026, 3, 15),
        endDate: new Date(2026, 3, 20),
      },
    });

    await prisma.event.create({
      data: {
        adminId: testAdmin.id,
        noticeId: testNotice.id,
        title: testNotice.title,
      },
    });
  });

  // [테스트 종료] 테스트 진행 시 생성한 데이터 삭제
  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /events', () => {
    it('로그인한 사용자가 특정 년/월의 이벤트를 조회하면 200을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Event@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. API 호출 시 토큰 헤더 수동 주입
      const resUser1 = await userAgent1
        .get('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          apartmentId: testApartment1.id,
          year: 2026,
          month: 4,
        });

      // 3. 결과 검증
      expect(resUser1.status).toBe(200);
      expect(Array.isArray(resUser1.body)).toBe(true);
    });

    it('로그인한 사용자가 다른 아파트를 조회하면 403을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent2
        .post('/auth/login')
        .send({ email: 'user2Event@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. API 호출 시 토큰 헤더 수동 주입
      const resUser1 = await userAgent1
        .get('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          apartmentId: testApartment1.id,
          year: 2026,
          month: 4,
        });

      // 3. 결과 검증
      expect(resUser1.status).toBe(403);
    });
  });
});
