import { Request, Response } from 'express';
import { ResidentListService } from './residentList.service';
import { UserService } from '../user';
import BadRequestError from '../../lib/errors/BadRequestError';
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

  // 사용자로부터 파라미터로 id 받아서 명부 생성 - 보류
  async createResidentFromUser(req: Request, res: Response) {
    // 입주민 명부 id
    const userId = req.params.id;
    // 로그인 한 관리자
    const adminId = req.user!.id;
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
    res.status(200).json(result);
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
    res.status(200).json(result);
  }
}
