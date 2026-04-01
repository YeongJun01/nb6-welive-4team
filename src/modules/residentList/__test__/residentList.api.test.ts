import request from 'supertest';
import app from '../../../app';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { IsHouseholder } from '../residentList.dto';
import { Status } from '@prisma/client';

describe('입주자 명부 api 테스트', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // DB 초기화
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
        id: 'apt-1',
        name: '테스트 아파트',
        address: '서울',
        officeNumber: '0249482674',
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
    //  관리자 유저 생성
    await prisma.user.create({
      data: {
        id: 'admin1',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        name: '관리자',
        contact: '01023456789',
        email: 'test@test.com',
        joinStatus: 'APPROVED',
        apartmentId: 'apt-1',
      },
    });
    // 일반 유저 생성
    await prisma.user.create({
      data: {
        id: 'user1',
        username: 'user',
        password: hashedPassword,
        role: 'USER',
        name: '입주자',
        contact: '01023456782',
        email: 'test1@test.com',
        joinStatus: 'APPROVED',
        apartmentId: 'apt-1',
      },
    });

    // 관리자 로그인해서 토큰 받기
    const res = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '1234',
    });

    adminToken = res.header.authorization.split(' ')[1];
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // getResidentList
  it('입주민 목록 조회 성공', async () => {
    const resident = await prisma.residentList.createMany({
      data: [
        {
          apartmentId: 'apt-1',
          apartmentDong: '101',
          apartmentHo: '1001',
          name: '홍길동',
          contact: '010',
          isHouseholder: true,
          approvalStatus: Status.APPROVED,
          isRegistered: true,
          email: 'test@test.com',
        },
        {
          apartmentId: 'apt-1',
          apartmentDong: '102',
          apartmentHo: '1002',
          name: '김철수',
          contact: '011',
          isHouseholder: false,
          approvalStatus: Status.APPROVED,
          isRegistered: true,
          email: 'test2@test.com',
        },
      ],
    });

    const res = await request(app).get('/residents').set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.residents[0].name).toBe('홍길동');
    expect(res.body.residents[1].name).toBe('김철수');
  });

  // createResidentList
  it('입주민 생성 성공', async () => {
    const res = await request(app)
      .post('/residents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        building: '101',
        unitNumber: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: IsHouseholder.HOUSEHOLDER,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('홍길동');
  });

  it('세대주 중복이면 생성 실패', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '기존세대주',
        contact: '010',
        isHouseholder: true,
        approvalStatus: Status.APPROVED,
      },
    });

    // 같은 아파트에 세대주 중복
    const res = await request(app)
      .post('/residents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        building: '101',
        unitNumber: '1001',
        name: '기존세대주',
        isHouseholder: 'HOUSEHOLDER',
        contact: '010',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('이미 등록된 입주민입니다.');
  });

  // getResidentListById
  it('입주민 단건 조회 성공', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: true,
        approvalStatus: Status.APPROVED,
        isRegistered: true,
        email: 'test@test.com',
      },
    });

    const res = await request(app)
      .get(`/residents/${resident.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(resident.id);
  });

  it('없는 입주민 조회 실패', async () => {
    const res = await request(app)
      .get('/residents/invalid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // updateResidentList
  it('입주민 수정 성공', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        email: 'test@test.com',
        approvalStatus: Status.APPROVED,
        isRegistered: true,
        isHouseholder: false,
      },
    });

    const res = await request(app)
      .patch(`/residents/${resident.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '수정된이름',
        isHouseholder: IsHouseholder.HOUSEHOLDER,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('수정된이름');
    expect(res.body.isHouseholder).toBe(IsHouseholder.HOUSEHOLDER);
  });
  it('관리자가 아니면 수정 실패', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        email: 'test@test.com',
        approvalStatus: Status.APPROVED,
        isRegistered: true,
        isHouseholder: false,
      },
    });
    const userLogin = await request(app).post('/auth/login').send({
      email: 'test1@test.com',
      password: '1234',
    });

    userToken = userLogin.header.authorization.split(' ')[1];

    const res = await request(app)
      .patch(`/residents/${resident.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'test' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('관리자가 아닙니다.');
  });

  // deleteResidentList
  it('입주민 삭제 성공', async () => {
    const resident = await prisma.residentList.create({
      data: {
        apartmentId: 'apt-1',
        apartmentDong: '101',
        apartmentHo: '1001',
        name: '홍길동',
        contact: '010',
        isHouseholder: true,
        approvalStatus: Status.APPROVED,
        isRegistered: true,
        email: 'test@test.com',
      },
    });

    const res = await request(app)
      .delete(`/residents/${resident.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  // csv를 통한 업로드
  it('CSV 업로드 성공', async () => {
    // 사용할 데이터 문자열로 생성
    const csvData = `동,호수,이름,연락처,세대주여부
101,1001,홍길동,010,HOUSEHOLDER
101,1001,김철수,011,MEMBER`;

    // csvData 문자열을 파일처럼 만들어 업로드 (Buffer)
    const res = await request(app)
      .post('/residents/from-file')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csvData), 'test.csv');

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);

    const residents = await prisma.residentList.findMany();
    expect(residents.length).toBe(2);
    expect(residents[0].name).toBe('홍길동');
    expect(residents[1].name).toBe('김철수');
  });

  // 템플릿 다운로드
  it('CSV 템플릿 다운로드 성공', async () => {
    const res = await request(app)
      .get('/residents/file/template')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // 헤더 검증
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');

    // 내용 검증 (컬럼 구조)
    expect(res.text).toContain('동');
    expect(res.text).toContain('호수');
    expect(res.text).toContain('이름');
  });

  // 목록 파일로 다운로드
  it('입주민 목록 CSV 다운로드 성공', async () => {
    // 먼저 목록 생성
    await prisma.residentList.createMany({
      data: [
        {
          apartmentId: 'apt-1',
          apartmentDong: '101',
          apartmentHo: '1001',
          name: '홍길동',
          contact: '010',
          isHouseholder: true,
          approvalStatus: Status.APPROVED,
          isRegistered: true,
          email: 'test@test.com',
        },
        {
          apartmentId: 'apt-1',
          apartmentDong: '102',
          apartmentHo: '1002',
          name: '김철수',
          contact: '011',
          isHouseholder: false,
          approvalStatus: Status.APPROVED,
          isRegistered: true,
          email: 'test2@test.com',
        },
      ],
    });

    const res = await request(app)
      .get('/residents/file')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // 헤더
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');

    // 데이터 검증
    const lines = res.text.trim().split('\n');

    expect(lines[0]).toBe('동,호수,이름,연락처,세대주여부');
    expect(lines[1]).toBe('101,1001,홍길동,010,HOUSEHOLDER');
    expect(lines[2]).toBe('102,1002,김철수,011,MEMBER');
  });
});
