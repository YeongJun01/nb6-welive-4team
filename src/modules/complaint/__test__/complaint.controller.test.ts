import request from 'supertest';
import prisma from '../../../lib/prisma';
import app from '../../../app';
import * as bcrypt from 'bcrypt';
import http from 'http';
import { initSocket } from '../../../lib/socket';

describe('Complaint API 통합 테스트', () => {
  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자용 변수 선언
  const userAgent1 = request.agent(app);
  const userAgent2 = request.agent(app);
  const adminAgent = request.agent(app);

  let testApartment: any;
  let testAdmin: any;
  let testUser1: any;
  let testUser2: any;
  let testBoard: any;
  let testComplaint1: any;
  let testComplaint2: any;

  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자 데이터 생성
  beforeAll(async () => {
    // 0. 기존 잔여 데이터 청소
    const dummyServer = http.createServer();
    initSocket(dummyServer);

    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    // 1. 테스트용 아파트 생성
    testApartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트 complaint',
        address: '서울시 강남구 complaint',
        officeNumber: '021234567complaint',
        description: '테스트용 아파트입니다 complaint',
        endComplexNumber: 2,
        endBuildingNumber: 2,
        endFloorNumber: 2,
        endUnitNumber: 2,
        apartmentStatus: 'APPROVED',
      },
    });

    // 2. 테스트용 사용자 & 관리자 생성
    const hashedPassword = await bcrypt.hash('test1234', 10);
    testAdmin = await prisma.user.create({
      data: {
        username: 'testadminComplaint',
        password: hashedPassword,
        name: '관리자 complaint',
        email: 'adminComplaint@test.com',
        contact: '01012345678complaint',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
      },
    });

    testUser1 = await prisma.user.create({
      data: {
        username: 'testuser1Complaint',
        password: hashedPassword,
        name: '사용자1 complaint',
        email: 'user1Complaint@test.com',
        contact: '01087654321complaint',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '101',
            apartmentHo: '101',
            contact: '01087654321complaint',
            name: '사용자1 complaint',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        username: 'testuser2Complaint',
        password: hashedPassword,
        name: '사용자2 complaint',
        email: 'user2Complaint@test.com',
        contact: '01087654322complaint',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '102',
            apartmentHo: '102',
            contact: '01087654321complaint',
            name: '사용자1 complaint',
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
        boardType: 'COMPLAINT',
      },
    });
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.complaint.deleteMany();
  });

  async function createTestComplaints() {
    testComplaint1 = await prisma.complaint.create({
      data: {
        boardId: testBoard.id,
        creatorId: testUser1.id,
        adminId: testAdmin.id,
        title: '민원 1',
        content: '내용',
        isPublic: true,
        apartmentDong: '101',
        apartmentHo: '101',
        status: 'PENDING',
        viewCount: 0,
      },
    });

    testComplaint2 = await prisma.complaint.create({
      data: {
        boardId: testBoard.id,
        creatorId: testUser1.id,
        adminId: testAdmin.id,
        title: '민원 2',
        content: '내용',
        isPublic: true,
        apartmentDong: '102',
        apartmentHo: '102',
        status: 'IN_PROGRESS',
        viewCount: 0,
      },
    });
  }

  // [테스트 종료] 테스트 진행 시 생성한 데이터 삭제
  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.notification.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /complaints', () => {
    const getComplaintTestData = () => ({
      boardId: testBoard.id,
      title: '민원 1',
      content: '내용',
      isPublic: true,
      status: 'PENDING',
    });

    it('사용자가 민원을 생성하면 201을 반환하고, 관리자에게 알림이 생성된다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 민원 생성 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/complaints')
        .send({
          ...getComplaintTestData(),
        });

      // 3. 기본 응답 확인
      const findComplaint = await prisma.complaint.findFirst({
        where: {
          boardId: testBoard.id,
          title: '민원 1',
        },
      });
      expect(res.status).toBe(201);
      expect(findComplaint!.title).toBe('민원 1');

      // 4. Side Effect 확인
      const notifications = await prisma.notification.findMany({
        where: {
          url: `/complaints/${findComplaint!.id}`,
        },
      });
      expect(notifications.length).toBe(1);
      expect(notifications[0].userId).toBe(testAdmin.id);
    });

    it('관리자가 민원을 생성하는 경우, 403을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminComplaint@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 민원 생성 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/complaints')
        .send(getComplaintTestData());

      // 3. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('입력값 오류로 민원을 생성하는 경우, 400을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 민원 생성 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post('/complaints')
        .send({
          ...getComplaintTestData(),
          status: 'NOTENUM',
        });

      // 3. 기본 응답 확인
      expect(res.status).toBe(400);
    });
  });

  describe('GET /complaints', () => {
    it('사용자가 민원 목록을 조회하는 경우 쿼리를 사용하지 않으면 200과 함께 민원 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 민원 목록 조회 API 호출
      const res = await userAgent1.set('Authorization', `Bearer ${accessToken}`).get('/complaints');
      const complaintCount = await prisma.complaint.count();

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.complaints.length).toBe(2);
      expect(res.body.totalCount).toBe(complaintCount);
    });

    it('사용자가 민원 목록을 조회하는 경우 정상 쿼리를 사용하면 200과 함께 민원 목록을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 3. 민원 목록 조회 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/complaints')
        .query({
          page: 1,
          limit: 10,
          status: 'PENDING',
          keyword: '민원 1',
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.complaints.length).toBe(1);
      expect(res.body.complaints[0].title).toBe('민원 1');
    });
  });

  describe('GET /complaints/:complaintId', () => {
    it('사용자가 본인의 민원 상세 정보를 조회하면 viewCount가 1 증가 후 200과 함께 세부 정보를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 상세 조회 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .get(`/complaints/${testComplaint1.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.viewsCount).toBe(testComplaint1.viewCount + 1);
      expect(res.body).toBeDefined();
    });

    it('존재하지 않는 민원을 상세 조회하면 404를 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 존재하지 않는 민원 상세 조회 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .get('/complaints/550e8400-e29b-41d4-a716-446655440000');

      // 4. 기본 응답 확인
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /complaints/:complaintId', () => {
    it('작성자가 민원을 수정하면 200을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 수정 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/complaints/${testComplaint1.id}`)
        .send({
          title: '수정된 민원 제목',
          content: '수정된 내용',
          isPublic: true,
        });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정된 민원 제목');
    });

    it('작성자가 아닌 사용자가 수정을 시도하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent2
        .post('/auth/login')
        .send({ email: 'user2Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 수정 API 호출
      const res = await userAgent2
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/complaints/${testComplaint1.id}`)
        .send({
          title: '다른 사람 수정 시도',
          content: '내용',
          isPublic: true,
        });

      expect(res.status).toBe(403);
    });

    it('처리 중인 민원의 수정을 시도하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 수정 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/complaints/${testComplaint2.id}`)
        .send({
          title: '처리 중인 민원 수정 시도',
          content: '내용',
          isPublic: true,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /complaints/:complaintId/status', () => {
    it('관리자가 민원 상태를 변경하면 200을 반환하고, 작성자에게 알림이 생성된다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await adminAgent
        .post('/auth/login')
        .send({ email: 'adminComplaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 수정 API 호출
      const res = await adminAgent
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/complaints/${testComplaint1.id}/status`)
        .send({ status: 'IN_PROGRESS' });

      // 4. 기본 응답 확인
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PROGRESS');

      // 5. 알림이 생성되었는지 확인
      const notifications = await prisma.notification.findMany({
        where: {
          url: `/complaints/${testComplaint1.id}`,
        },
      });
      expect(notifications.length).toBe(1);
    });

    it('일반 사용자가 민원 상태 변경을 시도하면 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 수정 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .patch(`/complaints/${testComplaint1.id}/status`)
        .send({ status: 'RESOLVED' });

      // 4. 기본 응답 확인
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /complaints/:complaintId', () => {
    it('작성자가 민원을 삭제하면 204을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 삭제 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/complaints/${testComplaint1.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(204);

      // 5. 민원이 실제로 삭제되지 않고 deletedAt만 업데이트 되었는지 확인
      const deletedCheck = await prisma.complaint.findUnique({ where: { id: testComplaint1.id } });
      expect(deletedCheck?.deletedAt).not.toBeNull();
    });

    it('작성자가 아닌 유저가 삭제 시도 시 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent2
        .post('/auth/login')
        .send({ email: 'user2Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 삭제 API 호출
      const res = await userAgent2
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/complaints/${testComplaint1.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(403);
    });

    it('처리 중인 민원을 삭제 시도 시 403을 반환한다', async () => {
      // 1. 테스트 데이터 준비
      await createTestComplaints();

      // 2. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'user1Complaint@test.com', password: 'test1234' });
      const accessToken = loginRes.headers.authorization.replace(/^Bearer\s+/i, '');

      // 3. 민원 삭제 API 호출
      const res = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/complaints/${testComplaint2.id}`);

      // 4. 기본 응답 확인
      expect(res.status).toBe(403);
    });
  });
});
