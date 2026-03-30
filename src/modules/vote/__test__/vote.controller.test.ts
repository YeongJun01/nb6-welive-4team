import request from 'supertest';
import prisma from '../../../lib/prisma';
import app from '../../../app';
import * as bcrypt from 'bcrypt';
import http from 'http';
import { initSocket } from '../../../lib/socket';

describe('Poll API 통합 테스트', () => {
  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자용 변수 선언
  const userAgent1 = request.agent(app);
  const userAgent2 = request.agent(app);
  const userAgent3 = request.agent(app);

  let testApartment: any;
  let testAdmin: any;
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let testBoard: any;
  let testPoll1: any;
  let testPoll2: any;
  let testPoll3: any;

  // [초기 셋팅] 테스트용 아파트, 관리자, 사용자 데이터 생성
  beforeAll(async () => {
    // 0. 기존 잔여 데이터 청소
    const dummyServer = http.createServer();
    initSocket(dummyServer);

    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.board.deleteMany();
    await prisma.residentList.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();

    // 1. 테스트용 아파트 생성
    testApartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트 vote',
        address: '서울시 강남구 vote',
        officeNumber: '021234567vote',
        description: '테스트용 아파트입니다 vote',
        endComplexNumber: 1,
        endBuildingNumber: 2,
        endFloorNumber: 1,
        endUnitNumber: 2,
        apartmentStatus: 'APPROVED',
      },
    });

    // 2. 테스트용 사용자 & 관리자 생성
    const hashedPassword = await bcrypt.hash('test1234', 10);
    testAdmin = await prisma.user.create({
      data: {
        username: 'testadminVote',
        password: hashedPassword,
        name: '관리자 vote',
        email: 'adminVote@test.com',
        contact: '01012345678vote',
        role: 'ADMIN',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
      },
    });

    testUser1 = await prisma.user.create({
      data: {
        username: 'testuserVote1',
        password: hashedPassword,
        name: '사용자 vote1',
        email: 'userVote1@test.com',
        contact: '01087654321vote',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '101',
            apartmentHo: '101',
            contact: '01087654321vote1',
            name: '사용자 vote1',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        username: 'testuserVote2',
        password: hashedPassword,
        name: '사용자 vote2',
        email: 'userVote2@test.com',
        contact: '01087654321vote2',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '102',
            apartmentHo: '102',
            contact: '01087654321vote2',
            name: '사용자 vote2',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });

    testUser3 = await prisma.user.create({
      data: {
        username: 'testuserVote3',
        password: hashedPassword,
        name: '사용자 vote3',
        email: 'userVote3@test.com',
        contact: '01087654321vote3',
        role: 'USER',
        joinStatus: 'APPROVED',
        apartmentId: testApartment.id,
        residentLists: {
          create: {
            apartmentId: testApartment.id,
            apartmentDong: '101',
            apartmentHo: '102',
            contact: '01087654321vote3',
            name: '사용자 vote3',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });

    // 3. 테스트 투표 준비
    testBoard = await prisma.board.create({
      data: {
        adminId: testAdmin.id,
        apartmentId: testApartment.id,
        boardType: 'POLL',
      },
    });

    testPoll1 = await prisma.poll.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        status: 'ONGOING',
        buildingPermission: ['ALL'],
        title: '투표 1',
        description: '내용 1',
        startDate: new Date(Date.now()),
        endDate: new Date(Date.now() + 172800000),
        pollOptions: {
          create: [{ content: '투표 1 - 옵션1' }, { content: '투표 1 - 옵션2' }],
        },
      },
      include: { pollOptions: true },
    });

    testPoll2 = await prisma.poll.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        status: 'UPCOMING',
        buildingPermission: ['ALL'],
        title: '투표 2',
        description: '내용 2',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        pollOptions: {
          create: [{ content: '투표 2 - 옵션1' }, { content: '투표 2 - 옵션2' }],
        },
      },
      include: { pollOptions: true },
    });

    testPoll3 = await prisma.poll.create({
      data: {
        boardId: testBoard.id,
        adminId: testAdmin.id,
        status: 'ONGOING',
        buildingPermission: ['101'],
        title: '투표 2',
        description: '내용 2',
        startDate: new Date(Date.now()),
        endDate: new Date(Date.now() + 172800000),
        pollOptions: {
          create: [{ content: '투표 2 - 옵션1' }, { content: '투표 2 - 옵션2' }],
        },
      },
      include: { pollOptions: true },
    });
  });

  beforeEach(async () => {
    await prisma.vote.deleteMany();
    await prisma.pollOption.updateMany({
      data: { voteCount: 0 },
    });
  });

  // [테스트 종료] 테스트 진행 시 생성한 데이터 삭제
  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.board.deleteMany();
    await prisma.residentList.deleteMany();
    await prisma.user.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /options/:optionId/vote', () => {
    it('사용자가 투표를 하면 201을 반환하고, 투표 옵션 voteCount가 1 증가한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'userVote1@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 진행 API 호출
      const response = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post(`/options/${testPoll1.pollOptions[0].id}/vote`)
        .send({});

      // 3. 기본 응답 및 결과 확인
      expect(response.status).toBe(201);

      const updatedOption = await prisma.pollOption.findUnique({
        where: { id: testPoll1.pollOptions[0].id },
      });
      expect(updatedOption?.voteCount).toBe(1);
    });

    it('진행중이 아닌 투표에 투표를 시도하면 400을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'userVote1@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 진행 API 호출
      const response = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post(`/options/${testPoll2.pollOptions[0].id}/vote`)
        .send({});

      // 3. 기본 응답 및 결과 확인
      expect(response.status).toBe(400);
    });

    it('투표 권한이 없는 사용자가 투표를 시도하면 403을 반환한다', async () => {
      // 1. 권한 없는 사용자(userAgent2) 로그인 수행 및 토큰 추출
      const loginRes = await userAgent2
        .post('/auth/login')
        .send({ email: 'userVote2@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 투표 진행 API 호출 (101동만 허용된 testPoll2에 102동 사용자가 투표 시도)
      const response = await userAgent2
        .set('Authorization', `Bearer ${accessToken}`)
        .post(`/options/${testPoll3.pollOptions[0].id}/vote`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /options/:optionId/vote', () => {
    it('사용자가 투표를 취소하면 204를 반환하고, 투표 옵션 voteCount가 1 감소한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'userVote1@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. 사전 투표 진행
      await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post(`/options/${testPoll1.pollOptions[0].id}/vote`)
        .send({});

      // 3. 투표 취소 API 호출
      const response = await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .delete(`/options/${testPoll1.pollOptions[0].id}/vote`)
        .send({});

      // 4. 기본 응답 및 결과 확인
      expect(response.status).toBe(204);

      const updatedOption = await prisma.pollOption.findUnique({
        where: { id: testPoll1.pollOptions[0].id },
      });
      expect(updatedOption?.voteCount).toBe(0);
    });

    it('투표를 하지 않은 사용자가 투표를 취소하면 400을 반환한다', async () => {
      // 1. 로그인 수행 및 토큰 추출
      const loginRes = await userAgent1
        .post('/auth/login')
        .send({ email: 'userVote1@test.com', password: 'test1234' });

      const authHeader = loginRes.headers.authorization;
      const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();

      // 2. userAgent1 사전 투표 진행
      await userAgent1
        .set('Authorization', `Bearer ${accessToken}`)
        .post(`/options/${testPoll1.pollOptions[0].id}/vote`)
        .send({});

      // 2. 투표 진행 API 호출
      const loginResOther = await userAgent3
        .post('/auth/login')
        .send({ email: 'userVote3@test.com', password: 'test1234' });

      const authHeaderOther = loginResOther.headers.authorization;
      const accessTokenOther = authHeaderOther.replace(/^Bearer\s+/i, '').trim();

      const response = await userAgent3
        .set('Authorization', `Bearer ${accessTokenOther}`)
        .delete(`/options/${testPoll1.pollOptions[0].id}/vote`)
        .send({});

      // 3. 기본 응답 및 결과 확인
      expect(response.status).toBe(400);
    });
  });
});
