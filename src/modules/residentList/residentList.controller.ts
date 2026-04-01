import { Request, Response } from 'express';
import { ResidentListService } from './residentList.service';
import { UserService } from '../user';
import { BadRequestError } from '../../lib/errors';
import { assert } from 'node:console';
import { CreateResident, UpdateResident } from './residentListStructs';

export class ResidentListController {
  constructor(private readonly residentListService: ResidentListService) {}

  // 입주자 목록 조회
  async getResidentsList(req: Request, res: Response) {
    const userId = req.user!.id;

    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      building: req.query.building as string,
      unitNumber: req.query.unitNumber as string,
      isRegistered: req.query.isRegistered ? req.query.isRegistered === 'true' : undefined,
      keyword: req.query.keyword as string,
    };

    const result = await this.residentListService.getResidentsList(userId, query);
    res.status(200).json(result);
  }

  // 입주자 개별 등록
  async createResident(req: Request, res: Response) {
    const userId = req.user!.id;

    assert(req.body, CreateResident);

    const result = await this.residentListService.createResident(userId, req.body);
    res.status(201).json(result);
  }

  // 입주자 상세 조회
  async getResidentById(req: Request, res: Response) {
    // 입주민 명부 id
    const { id } = req.params;
    //로그인 유저
    const userId = req.user!.id;

    if (Array.isArray(id)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    const result = await this.residentListService.getResidentById(userId, id);
    res.status(200).json(result);
  }

  // 입주민 정보 수정
  async updateResident(req: Request, res: Response) {
    // 입주민 명부 id
    const { id } = req.params;
    // 로그인 유저
    const userId = req.user!.id;

    if (Array.isArray(id)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    assert(req.body, UpdateResident);

    const result = await this.residentListService.updateResident(userId, id, req.body);
    res.status(200).json(result);
  }

  // 입주민 정보 삭제
  async deleteResident(req: Request, res: Response) {
    // 입주민 명부 id
    const { id } = req.params;
    // 로그인 유저
    const userId = req.user!.id;

    if (Array.isArray(id)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    const result = await this.residentListService.deleteResident(userId, id);
    res.status(204).json(result);
  }

  // 입주민 정보 삭제 (soft delete)
  async softDeleteResident(req: Request, res: Response) {
    // 입주민 명부 id
    const { id } = req.params;
    // 로그인 유저
    const userId = req.user!.id;

    if (Array.isArray(id)) {
      throw new BadRequestError('잘못된 요청입니다.');
    }

    const result = await this.residentListService.softDeleteResident(userId, id);
    res.status(204).json(result);
  }

  // 입주민 여러개 생성 (csv)
  async uploadResidentsByCsv(req: Request, res: Response) {
    if (!req.file) {
      throw new BadRequestError('CSV 파일이 업로드되지 않았습니다.');
    }

    const { id } = req.user!;

    const result = await this.residentListService.createResidentsByCsv(id, req.file);

    res.status(201).json(result);
  }

  // 입주 명부 템플릿 다운
  async downloadResidentCsvTemplate(req: Request, res: Response) {
    const csv = `동,호수,이름,연락처,세대주여부
101,101,홍길동,01012345678,HOUSEHOLDER
105,2008,김길동,01043215678,MEMBER`;

    const filename = encodeURIComponent('입주민명부_템플릿.csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="residentList_template.csv"; filename*=UTF-8''${filename}`,
    );
    res.send('\uFEFF' + csv); // BOM 추가 (엑셀 한글 깨짐 방지)
  }

  // 입주민 명부 목록 파일로 다운
  async downloadResidentsCsv(req: Request, res: Response) {
    const userId = req.user!.id;

    const query = {
      //page: req.query.page ? Number(req.query.page) : 1,
      //limit: req.query.limit ? Number(req.query.limit) : 10,
      building: req.query.building as string,
      unitNumber: req.query.unitNumber as string,
      isRegistered: req.query.isRegistered ? req.query.isRegistered === 'true' : undefined,
      keyword: req.query.keyword as string,
    };

    const csv = await this.residentListService.exportResidentsToCsv(userId, query);

    const filename = encodeURIComponent('입주민명부.csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="residents.csv"; filename*=UTF-8''${filename}`,
    );

    res.send('\uFEFF' + csv); // BOM (엑셀 한글 깨짐 방지)
  }
}
