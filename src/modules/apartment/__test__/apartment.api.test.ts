import request from 'supertest';
import app from '../../../app';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

describe('아파트 API 테스트 (공개)', () => {
  beforeEach(async () => {
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 아파트 목록 조회 (공개용)
  it('GET /apartments - 목록 조회', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트 아파트',
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

    const res = await request(app).get('/apartments/public');

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.apartments[0].name).toBe('테스트 아파트');
  });

  // 아파트 상세 조회 (공개용)
  it('GET /apartments/:id - 상세 조회', async () => {
    await prisma.apartment.create({
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

    const res = await request(app).get('/apartments/public/apt1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('테스트');
  });
  // 존재하지 않는 아파트
  it('GET /apartments/public/:id - 존재하지 않는 경우', async () => {
    const res = await request(app).get('/apartments/public/no-id');

    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });

  // 삭제된 아파트 조회
  it('GET /apartments/public/:id - 삭제된 아파트 조회 불가', async () => {
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '삭제된 아파트',
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
        deletedAt: new Date(),
      },
    });

    const res = await request(app).get('/apartments/public/apt1');

    expect(res.status).toBe(404);
  });
});

describe('인증 포함 아파트 API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    await prisma.complaintComment.deleteMany();
    await prisma.noticeComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();

    const hashedPassword = await bcrypt.hash('1234', 10);

    // 아파트 생성
    await prisma.apartment.create({
      data: {
        id: 'apt1',
        name: '테스트 아파트',
        address: '서울',
        officeNumber: '010',
        description: '설명',
        startComplexNumber: 1,
        endComplexNumber: 3,
        startBuildingNumber: 1,
        endBuildingNumber: 3,
        startFloorNumber: 1,
        endFloorNumber: 3,
        startUnitNumber: 1,
        endUnitNumber: 3,
        apartmentStatus: 'APPROVED',
        users: {
          create: [
            {
              id: 'admin1',
              name: '관리자',
              username: 'test',
              password: hashedPassword,
              contact: '01039483948',
              email: 'test@test.com',
              role: 'ADMIN',
              joinStatus: 'APPROVED',
            },
          ],
        },
      },
    });

    // 로그인해서 토큰 받기
    const res = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    adminToken = res.header.authorization.split(' ')[1];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 관리자 아파트 조회
  it('GET /apartments - 관리자 아파트 조회', async () => {
    const res = await request(app).get('/apartments').set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.apartments[0].name).toBe('테스트 아파트');
    expect(res.body.apartments[0].address).toBe('서울');
    expect(res.body.apartments[0].adminId).toBe('admin1');
    expect(res.body.apartments[0].adminName).toBe('관리자');
  });
  it('GET /apartments - 토큰 없으면 실패', async () => {
    const res = await request(app).get('/apartments');

    expect(res.status).toBe(401);
  });
  it('GET /apartments - 일반 유저 접근 불가', async () => {
    // 비밀번호 해싱
    const hashed = await bcrypt.hash('1234', 10);
    // 일반 유저 생성
    await prisma.user.create({
      data: {
        id: 'user1',
        username: 'user',
        password: hashed,
        role: 'USER',
        name: '유저',
        contact: '01039483933',
        email: 'user@test.com',
        joinStatus: 'APPROVED',
      },
    });

    const loginRes = await request(app).post('/auth/login').send({
      email: 'user@test.com',
      password: '1234',
    });

    userToken = loginRes.header.authorization.split(' ')[1];

    const res = await request(app).get('/apartments').set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // 관리자 아파트 상세 조회
  it('GET /apartments/:id - 관리자 상세 조회 성공', async () => {
    const res = await request(app)
      .get('/apartments/apt1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('테스트 아파트');
    expect(res.body.address).toBe('서울');
    expect(res.body.adminId).toBe('admin1');
    expect(res.body.adminName).toBe('관리자');
  });

  it('GET /apartments/:id - 토큰 없으면 실패', async () => {
    const res = await request(app).get('/apartments/apt1');

    expect(res.status).toBe(401);
  });

  it('GET /apartments/:id - 존재하지 않는 아파트', async () => {
    const res = await request(app)
      .get('/apartments/not-exist')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('GET /apartments/:id - 일반 유저 접근 불가', async () => {
    // 일반 유저 생성
    const hashed = await bcrypt.hash('1234', 10);

    await prisma.user.create({
      data: {
        id: 'user1',
        username: 'user',
        password: hashed,
        role: 'USER',
        name: '유저',
        contact: '010',
        email: 'user@test.com',
        joinStatus: 'APPROVED',
      },
    });

    const loginRes = await request(app).post('/auth/login').send({
      email: 'user@test.com',
      password: '1234',
    });

    userToken = loginRes.header.authorization.split(' ')[1];

    const res = await request(app)
      .get('/apartments/apt1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
