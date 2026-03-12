import prisma from '../../lib/prisma';
import { CreateApartmentDto } from './apartment.dto';

class ApartmentRepository {
  // 아파트 전체 목록 조회
  async getApartments(params?: { keyword?: string; name?: string; address?: string }) {
    const where: any = {
      deletedAt: null, // 삭제되지 않은 아파트만 조회
    };

    if (params?.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { address: { contains: params.keyword } },
      ];
    }

    if (params?.name) {
      where.name = { contains: params.name };
    }

    if (params?.address) {
      where.address = { contains: params.address };
    }

    return await prisma.apartment.findMany({
      where,
      include: {
        users: {
          where: {
            role: 'ADMIN', // 관리자 정보만 포함
          },
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
          },
        },
      },
    });
  }

  // 관리자 ID로 아파트 조회 (관리자용)
  async getApartmentByAdminId(
    adminId: string,
    params?: { keyword?: string; name?: string; address?: string },
  ) {
    const where: any = {
      deletedAt: null, // 삭제되지 않은 아파트만 조회
    };

    if (params?.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { address: { contains: params.keyword } },
      ];
    }

    if (params?.name) {
      where.name = { contains: params.name };
    }

    if (params?.address) {
      where.address = { contains: params.address };
    }

    return await prisma.apartment.findFirst({
      where: {
        users: {
          some: {
            id: adminId,
          },
        },
        deletedAt: null, // 삭제되지 않은 아파트만 조회
      },
      include: {
        users: {
          where: {
            role: 'ADMIN', // 관리자 정보만 포함
          },
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
          },
        },
      },
    });
  }

  // 아파트 상세 조회 (하나)
  async getApartmentById(id: string) {
    return await prisma.apartment.findFirst({
      where: {
        id,
        deletedAt: null, // 삭제되지 않은 아파트만 조회
      },
      include: {
        users: {
          where: {
            role: 'ADMIN', // 관리자 정보만 포함
          },
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
          },
        },
      },
    });
  }

  // 아파트 생성
  async createApartment(data: CreateApartmentDto) {
    return await prisma.apartment.create({
      data,
    });
  }
}

export default new ApartmentRepository();
