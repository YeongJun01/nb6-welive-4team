// src/modules/apartment/apartment.controller.ts
import prisma from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import apartmentService from './apartment.service';
import { UserService } from '../user';
import NotFoundError from '../../lib/errors/NotFoundError';
import UnauthorizedError from '../../lib/errors/UnauthorizedError';

class ApartmentController {
  // 1. 아파트 목록 조회
  async getApartments(req: Request, res: Response) {
    // 쿼리 저장
    const keyword = req.query.keyword as string | undefined;
    const name = req.query.name as string | undefined;
    const address = req.query.address as string | undefined;
    // 인증된 유저만 접근 가능하므로 로그인 여부 확인
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }
    // 인증 미들웨어가 붙으면 req.user에 로그인한 유저 정보가 담깁니다.
    const userId = req.user!.id;

    // DB에서 유저 조회
    // const user = await UserService.prototype.findUserById(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('유저를 찾을 수 없습니다.');
    }
    const role = user.role;

    let result;

    // [Q1] 유저의 역할(role)에 따라 적절한 서비스 메서드를 호출해 보세요.
    if (role === 'SUPER_ADMIN') {
      // 슈퍼관리자: 모든 아파트 목록
      result = await apartmentService.getAllApartmentsForSuperAdmin({ keyword, name, address });
    } else if (role === 'ADMIN') {
      // 일반 관리자: 본인이 관리하는 아파트 (user.id가 adminId가 됩니다)
      result = await apartmentService.getApartmentForAdmin(user.id, { keyword, name, address });
    }

    return res.status(200).json(result);
  }

  // 공개된 아파트 목록 조회 (로그인 여부와 상관없이 접근 가능)
  async getPublicApartments(req: Request, res: Response) {
    // 쿼리 저장
    const keyword = req.query.keyword as string | undefined;
    const name = req.query.name as string | undefined;
    const address = req.query.address as string | undefined;
    // 서비스 호출
    const result = await apartmentService.getApartmentsForPublic({ keyword, name, address });
    return res.status(200).json(result);
  }

  // 2. 아파트 상세 조회
  async getApartmentById(req: Request, res: Response) {
    const { id } = req.params as { id: string }; // URL 파라미터에서 아파트 ID 추출

    const userId = req.user!.id;

    // DB에서 유저 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('유저를 찾을 수 없습니다.');
    }
    const role = user?.role;

    let result;

    // [Q2] 관리자(SUPER_ADMIN, ADMIN)와 일반 유저를 구분하여 상세 조회 메서드를 호출해 보세요.
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // 관리자용 상세 조회 (관리자 정보 포함)
      result = await apartmentService.getApartmentByIdForAdmin(id);
    } else {
      // 일반용 상세 조회 (공개 정보만)
      result = await apartmentService.getApartmentByIdForPublic(id);
    }

    // 조회된 결과가 없을 경우(null)에 대한 처리
    if (!result) {
      throw new NotFoundError('아파트를 찾을 수 없습니다.');
    }

    return res.status(200).json(result);
  }

  // 공개된 아파트 상세 조회 (로그인 여부와 상관없이 접근 가능)
  async getApartmentByIdForPublic(req: Request, res: Response) {
    const { id } = req.params as { id: string }; // URL 파라미터에서 아파트 ID 추출

    const result = await apartmentService.getApartmentByIdForPublic(id);

    if (!result) {
      throw new NotFoundError('아파트를 찾을 수 없습니다.');
    }

    return res.status(200).json(result);
  }
}

export default new ApartmentController();
