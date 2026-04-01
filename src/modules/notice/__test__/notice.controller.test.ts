import request from 'supertest';
import prisma from '../../../lib/prisma';
import app from '../../../app';
import * as bcrypt from 'bcrypt';
import http from 'http';
import { initSocket } from '../../../lib/socket';

describe('Notice API 통합 테스트', () => {
  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자용 변수 선언
  const userAgent = request.agent(app);
  const adminAgent = request.agent(app);

  let testApartment1: any;
  let testApartment2: any;
  let testAdmin: any;
  let testUser: any;
  let testBoard: any;
  let testNotice1: any;
  let testNotice2: any;

  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자 데이터 생성
  beforeAll(async () => {
    // 0. 기존 잔여 데이터 청소
    const dummyServer = http.createServer();
    initSocket(dummyServer);

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
        name: '테스트 아파트 notice',
        address: '서울시 강남구 notice',
        officeNumber: '021234567notice',
        description: '테스트용 아파트입니다 notice',
        endComplexNumber: 1,
        endBuildingNumber: 1,
        endFloorNumber: 1,
        endUnitNumber: 1,
        apartmentStatus: 'APPROVED',
      },
    });

    testApartment2 = await prisma.apartment.create({
      data: {
        name: '테스트 아파트2 notice',
        address: '서울시 강남구2 notice',
        officeNumber: '021234568notice',
        description: '테스트용 아파트입니다2 notice',
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
        username: 'testadminNotice',
        password: hashedPassword,
        name: '관리자 notice',
        email: 'adminNotice@test.com',
        contact: '01012345678notice',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: testApartment1.id,
      },
    });

    testUser = await prisma.user.create({
      data: {
        username: 'testuserNotice',
        password: hashedPassword,
        name: '사용자 notice',
        email: 'userNotice@test.com',
        contact: '01087654321notice',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment1.id,
      },
    });

    // 3. 테스트 게시판 준비
    testBoard = await prisma.board.create({
      data: {
        adminId: testAdmin.id,
        apartmentId: testApartment1.id,
        boardType: 'NOTICE',
      },
    });
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.notice.deleteMany();
  });

  async function createTestNotices() {
    testNotice1 = await prisma.notice.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        category: 'MAINTENANCE',
        title: '4월 점검 공지',
        content: '내용',
        isPinned: false,
      },
    });

    testNotice2 = await prisma.notice.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        category: 'EMERGENCY',
        title: '긴급 공지',
        content: '긴급 내용',
        isPinned: false,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
      },
    });
  }

  // [테스트 종료] 테스트 진행 시 생성한 데이터 삭제
  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /notices', () => {
    const getNoticeTestData = () => ({
      category: 'MAINTENANCE',
      boardId: testBoard!.id,
      title: '4월 점검 공지',
      content: '내용',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
    });

    it('관리자가 기간이 없는 공지사항을 생성하면 201을 반환하고, 알림은 함께 생성되고 이벤트는 생성되지 않는다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 공지사항 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/notices')
        .send({
          ...getNoticeTestData(),
          startDate: undefined,
          endDate: undefined,
        });

      // 3. 기본 응답 확인
      expect(res.status).toBe(201);

      // 4. Side Effect 확인
      const noticeCount = await prisma.notice.count();
      const eventCount = await prisma.event.count();
      const notificationCount = await prisma.notification.count();
      expect(noticeCount).toBe(1);
      expect(eventCount).toBe(0);
      expect(notificationCount).toBeGreaterThan(1);
    });

    it('관리자가 기간이 있는 공지사항을 생성하면 201을 반환하고, 알림 및 이벤트가 함께 생성된다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 공지사항 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/notices')
        .send({ ...getNoticeTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(201);

      // 4. Side Effect 확인
      const noticeCount = await prisma.notice.count();
      const eventCount = await prisma.event.count();
      const notificationCount = await prisma.notification.count();
      expect(noticeCount).toBe(1);
      expect(eventCount).toBe(1);
      expect(notificationCount).toBeGreaterThan(1);
    });

    it('일반 사용자가 공지사항을 생성하는 경우, 403을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 공지사항 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/notices')
        .send({ ...getNoticeTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('입력값 오류로 공지사항을 생성하는 경우, 400을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 공지사항 항목 중 필수값이며 기본값이 없는 boardId, category,
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/notices')
        .send({
          //   category: 'MAINTENANCE',
          //   boardId: testBoard!.id,
          title: '4월 점검 공지',
          content: '내용',
        });

      // 3. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('GET /notices', () => {
    it('공지사항 목록 조회 시 쿼리를 사용하지 않으면 200과 함께 전체 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 목록 조회 API 호출
      const res = await userAgent.set('Authorization', `Bearer ${accessToken}`).get('/notices');
      const noticeCount = await prisma.notice.count();

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.notices.length).toBe(2);
      expect(res.body.totalCount).toBe(noticeCount);
    });

    it('공지사항 목록 조회 시 정상 쿼리를 사용하면 200과 함께 쿼리에 맞는 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 목록 조회 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/notices')
        .query({ page: '1', limit: '10', category: 'MAINTENANCE', search: '점검' });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.notices.length).toBe(1);
    });

    it('공지사항 목록 조회 시 쿼리값에 오류가 있으면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 목록 조회 API 호출 (query 파라미터는 .query()로 전달해야 합니다)
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/notices')
        .query({ page: '1', limit: '10', category: 'NotEnum' });

      // 4. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('GET /notices/:noticeId', () => {
    it('공지사항을 상세 조회 시 viewCount가 1 증가한 후 200과 함께 세부 정보를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 상세 조회 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get(`/notices/${testNotice!.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.viewsCount).toBe(testNotice!.viewCount + 1);
      expect(res.body.title).toBe(testNotice!.title);
    });

    it('존재하지 않는 공지사항을 상세 조회 시 404를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 상세 조회 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/notices/550e8400-e29b-41d4-a716-446655440000');

      // 4. 기본 응답 확인
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /notices/:noticeId', () => {
    const getNoticeTestData = () => ({
      category: 'MAINTENANCE',
      boardId: testBoard!.id,
      title: '4월 점검 공지',
      content: '내용',
    });

    it('관리자가 날짜가 없는 공지사항을 수정하면 200을 반환하고, 알림만 생성한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: null } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 수정 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/notices/${testNotice!.id}`)
        .send({
          ...getNoticeTestData(),
          title: '수정된 제목',
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정된 제목');

      // 5. 이벤트와 알림이 생성되었는지 확인
      const events = await prisma.event.findMany();
      expect(events.length).toBe(0);

      const notifications = await prisma.notification.findMany({
        where: {
          url: `/notices/${testNotice!.id}`,
        },
      });
      expect(notifications.length).toBeGreaterThan(1);
    });

    it('관리자가 날짜가 있는 공지사항을 수정하면 200을 반환하고, 이벤트와 알림을 생성한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: { not: null } } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 수정 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/notices/${testNotice!.id}`)
        .send({
          ...getNoticeTestData(),
          title: '수정된 제목',
          startDate: testNotice!.startDate,
          endDate: testNotice!.endDate,
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정된 제목');

      // 5. 이벤트와 알림이 생성되었는지 확인
      const events = await prisma.event.findMany();
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('수정된 제목');

      const notifications = await prisma.notification.findMany({
        where: {
          url: `/notices/${testNotice!.id}`,
        },
      });
      expect(notifications.length).toBeGreaterThan(1);
    });

    it('사용자가 공지사항을 수정하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: { not: null } } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 수정 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/notices/${testNotice!.id}`)
        .send({
          ...getNoticeTestData(),
          title: '수정된 제목',
          startDate: testNotice!.startDate,
          endDate: testNotice!.endDate,
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('입력값 오류로 공지사항을 수정하면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: { not: null } } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 수정 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/notices/${testNotice!.id}`)
        .send({
          ...getNoticeTestData(),
          category: 'test',
          startDate: testNotice!.startDate,
          endDate: testNotice!.endDate,
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(400);
    });

    it('noticeId가 유효하지 않으면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 수정 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/notices/invalid-uuid`)
        .send({
          ...getNoticeTestData(),
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /notices/:noticeId', () => {
    it('관리자가 공지사항을 삭제하면 204를 반환하고, 관련된 이벤트 데이터를 삭제한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: { not: null } } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 삭제 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/notices/${testNotice!.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(204);

      // 5. 이벤트 데이터가 삭제되었는지 확인
      const events = await prisma.event.findMany({
        where: {
          noticeId: testNotice!.id,
        },
      });
      expect(events.length).toBe(0);
    });

    it('noticeId가 유효하지 않으면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 삭제 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/notices/invalid-uuid`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(400);
    });

    it('사용자가 공지사항을 삭제하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestNotices();
      const testNotice = await prisma.notice.findFirst({ where: { startDate: { not: null } } });

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userNotice@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 공지사항 삭제 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/notices/${testNotice!.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(403);
    });
  });
});
