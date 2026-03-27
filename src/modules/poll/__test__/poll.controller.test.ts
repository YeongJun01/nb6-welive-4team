import request from 'supertest';
import prisma from '../../../lib/prisma';
import app from '../../../app';
import * as bcrypt from 'bcrypt';
import http from 'http';
import { initSocket } from '../../../lib/socket';

describe('Poll API 통합 테스트', () => {
  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자용 변수 선언
  const userAgent = request.agent(app);
  const adminAgent = request.agent(app);

  let testApartment: any;
  let testAdmin: any;
  let testUser: any;
  let testBoard: any;
  let testPoll1: any;
  let testPoll2: any;

  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자 데이터 생성
  beforeAll(async () => {
    // 0. 기존 잔여 데이터 청소
    const dummyServer = http.createServer();
    initSocket(dummyServer);

    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.board.deleteMany();
    await prisma.residentList.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    // 1. 테스트용 아파트 생성
    testApartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트 poll',
        address: '서울시 강남구 poll',
        officeNumber: '021234567poll',
        description: '테스트용 아파트입니다 poll',
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
        username: 'testadminPoll',
        password: hashedPassword,
        name: '관리자 poll',
        email: 'adminPoll@test.com',
        contact: '01012345678poll',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
      },
    });

    testUser = await prisma.user.create({
      data: {
        username: 'testuserPoll',
        password: hashedPassword,
        name: '사용자 poll',
        email: 'userPoll@test.com',
        contact: '01087654321poll',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '101',
            apartmentHo: '101',
            contact: '01087654321poll',
            name: '사용자 poll',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });

    // 3. 테스트 게시판 준비
    testBoard = await prisma.board.create({
      data: {
        adminId: testAdmin.id,
        apartmentId: testApartment.id,
        boardType: 'POLL',
      },
    });
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
  });

  async function createTestPolls() {
    testPoll1 = await prisma.poll.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        status: 'UPCOMING',
        buildingPermission: ['ALL'],
        title: '투표 1',
        description: '내용 1',
        startDate: new Date(2026, 3, 15),
        endDate: new Date(2026, 3, 30),
        pollOptions: {
          create: [{ content: '투표 1 - 옵션1' }, { content: '투표 1 - 옵션2' }],
        },
        events: {
          create: {
            adminId: testAdmin.id,
            title: '투표 1',
          },
        },
      },
    });

    testPoll2 = await prisma.poll.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        status: 'ONGOING',
        buildingPermission: ['101', '102'],
        title: '투표 2',
        description: '내용 2',
        startDate: new Date(2026, 3, 15),
        endDate: new Date(2026, 3, 30),
        pollOptions: {
          create: [{ content: '투표 2 - 옵션1' }, { content: '투표 2 - 옵션2' }],
        },
        events: {
          create: {
            adminId: testAdmin.id,
            title: '투표 2',
          },
        },
      },
    });
  }

  // [테스트 종료] 테스트 진행 시 생성한 데이터 삭제
  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.board.deleteMany();
    await prisma.residentList.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /polls', () => {
    const getPollTestData = () => ({
      boardId: testBoard!.id,
      status: 'PENDING',
      buildingPermission: ['ALL'],
      title: '투표 테스트',
      content: '내용',
      startDate: '2026-03-30',
      endDate: '2026-04-20',
      options: [{ title: '옵션1' }, { title: '옵션2' }],
    });

    it('관리자가 투표를 생성하면 201을 반환하고, 투표 옵션 & 알림 & 이벤트가 함께 생성된다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/polls')
        .send({ ...getPollTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(201);

      // 4. Side Effect 확인
      const pollOptionCount = await prisma.pollOption.count();
      const eventCount = await prisma.event.count();
      const notificationCount = await prisma.notification.count();

      expect(pollOptionCount).toBe(2);
      expect(eventCount).toBe(1);
      expect(notificationCount).toBe(2);
    });

    it('일반 사용자가 투표를 생성하는 경우, 403을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/polls')
        .send({ ...getPollTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('입력값 오류로 투표를 생성하는 경우, 400을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/polls')
        .send({ ...getPollTestData(), status: 'INVALID' });

      // 3. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('GET /polls', () => {
    it('투표 목록 조회 시 쿼리를 사용하지 않으면 200과 함께 전체 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent.set('Authorization', `Bearer ${accessToken}`).get('/polls');

      // 3. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.pollList.length).toBe(2);
      expect(res.body.totalCount).toBe(2);
    });

    it('투표 목록 조회 시 정상 쿼리를 사용하면 200과 함께 쿼리에 맞는 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/polls')
        .query({ page: 1, limit: 10, status: 'PENDING', keyword: '투표' });

      // 3. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.pollList.length).toBe(1);
    });

    it('투표 목록 조회 시 쿼리값에 오류가 있으면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/polls')
        .query({ page: 1, limit: 10, status: 'NotEnum' });

      // 3. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('GET /polls/:id', () => {
    it('투표 상세 정보를 조회하면 200과 함께 세부 정보를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get(`/polls/${testPoll1.id}`);

      // 3. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.title).toBe(testPoll1.title);
    });

    it('존재하지 않는 투표를 상세 조회하면 404를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/polls/550e8400-e29b-41d4-a716-446655440000');

      // 3. 기본 응답 확인
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /polls/:id', () => {
    const getPollTestData = () => ({
      title: '수정된 투표 제목',
      content: '수정된 투표 내용',
      buildingPermission: ['ALL'],
      startDate: '2026-04-15',
      endDate: '2026-04-30',
      status: 'PENDING',
      options: [{ title: '수정된 옵션1' }, { title: '수정된 옵션2' }],
    });

    it('관리자가 투표를 수정하면 200을 반환하고, 투표 옵션이 재생성 되고 이벤트가 수정된다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/polls/${testPoll1.id}`)
        .send({ ...getPollTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(200);

      // 4. Side Effect 확인
      const newPollOptions = await prisma.pollOption.findMany({
        where: { pollId: testPoll1.id },
      });
      const updatedEvent = await prisma.event.findFirst({
        where: { pollId: testPoll1.id },
      });

      expect(newPollOptions.length).toBe(2);
      expect(newPollOptions[0].content).toBe('수정된 옵션1');
      expect(updatedEvent!.title).toBe('수정된 투표 제목');
    });

    it('일반 사용자가 투표를 수정하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/polls/${testPoll1.id}`)
        .send({ ...getPollTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('입력값 오류로 투표를 수정하면 400을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/polls/${testPoll1.id}`)
        .send({ ...getPollTestData(), status: 'INVALID' });

      // 3. 기본 응답 확인
      expect(res.status).toBe(400);
    });

    it('존재하지 않는 투표를 수정하면 404를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch('/polls/550e8400-e29b-41d4-a716-446655440000')
        .send({ ...getPollTestData() });

      // 3. 기본 응답 확인
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /polls/:id', () => {
    it('관리자가 투표를 삭제하면 200을 반환하고, 투표와 관련된 데이터가 삭제된다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/polls/${testPoll1.id}`);

      // 3. 기본 응답 확인
      expect(res.status).toBe(204);

      // 4. Side Effect 확인
      const deletedPoll = await prisma.poll.findUnique({
        where: { id: testPoll1.id },
      });
      const deletedPollOptions = await prisma.pollOption.findMany({
        where: { pollId: testPoll1.id },
      });
      const deletedEvent = await prisma.event.findFirst({
        where: { pollId: testPoll1.id },
      });

      expect(deletedPoll?.deletedAt).not.toBeNull();
      expect(deletedPollOptions.length).toBe(0);
      expect(deletedEvent).toBeNull();
    });

    it('일반 사용자가 투표를 삭제하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent
        .post('/auth/login')
        .send({ email: 'userPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await userAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/polls/${testPoll1.id}`);

      // 3. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('존재하지 않는 투표를 삭제하면 404를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestPolls();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminPoll@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .delete('/polls/550e8400-e29b-41d4-a716-446655440000');

      // 3. 기본 응답 확인
      expect(res.status).toBe(404);
    });
  });
});
