import { PrismaClient, Prisma } from '@prisma/client';
import { CreateResidentDto, IsHouseholder } from './residentList.dto';

export class ResidentListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findResidentByUnique(where: Prisma.ResidentListWhereInput) {
    return await this.prisma.residentList.findFirst({ where });
  }

  // 입주자 목록 조회
  async getResidentsList(
    apartmentId: string,
    query?: {
      page?: number;
      limit?: number;
      building?: string;
      unitNumber?: string;
      isRegistered?: boolean;
      keyword?: string;
    },
  ) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ResidentListWhereInput = {
      apartmentId,
    };

    if (query?.building) {
      where.apartmentDong = query.building;
    }

    if (query?.unitNumber) {
      where.apartmentHo = query.unitNumber;
    }

    if (query?.isRegistered !== undefined) {
      where.isRegistered = query.isRegistered;
    }

    if (query?.keyword) {
      where.OR = [
        {
          name: {
            contains: query.keyword,
            mode: 'insensitive',
          },
        },
        {
          contact: {
            contains: query.keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [residents, totalCount] = await Promise.all([
      this.prisma.residentList.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.residentList.count({
        where,
      }),
    ]);
    return { residents, totalCount };
  }

  // 입주민 리소스 생성 (개별 등록)
  async createResident(apartmentId: string, data: CreateResidentDto) {
    // let isHouseholder;
    // if (data.isHouseholder === IsHouseholder.HOUSEHOLDER) {
    //   isHouseholder = true;
    // } else {
    //   isHouseholder = false;
    // }

    return await this.prisma.residentList.create({
      data: {
        apartmentId,
        apartmentDong: data.building,
        apartmentHo: data.unitNumber,
        contact: data.contact,
        name: data.name,
        isHouseholder: data.isHouseholder === IsHouseholder.HOUSEHOLDER,
      },
    });
  }

  // 중복 입주민 확인
  async findDuplicateResident(
    apartmentId: string,
    building: string,
    unitNumber: string,
    name: string,
    contact: string,
  ) {
    return this.prisma.residentList.findFirst({
      where: {
        apartmentId,
        apartmentDong: building,
        apartmentHo: unitNumber,
        name,
        contact,
      },
    });
  }

  // 사용자로부터 입주민 명부 생성 (가입시 호출되는 듯)
  async createResidentFromUser(userId: string, data: CreateResidentDto) {}

  // 입주민 상세 조회
  async getResidentById(id: string) {
    return await this.prisma.residentList.findUnique({
      where: { id },
    });
  }

  // 입주민 정보 수정
  async updateResident(id: string, data: CreateResidentDto) {
    let isHouseholder;
    if (data.isHouseholder === IsHouseholder.HOUSEHOLDER) {
      isHouseholder = true;
    } else {
      isHouseholder = false;
    }

    return await this.prisma.residentList.update({
      where: { id },
      data: {
        apartmentDong: data.building,
        apartmentHo: data.unitNumber,
        contact: data.contact,
        name: data.name,
        isHouseholder,
      },
    });
  }

  // 입주민 정보 삭제
  async deleteResident(id: string) {
    return await this.prisma.residentList.delete({
      where: { id },
    });
  }

  // 입주민 정보 삭제 (soft delete)
  async softDeleteResident(id: string) {
    return await this.prisma.residentList.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // 입주민 정보 여러개 생성 (csv)
  async createManyResidents(apartmentId: string, data: CreateResidentDto[]) {
    const residents = data.map((resident) => ({
      apartmentId,
      apartmentDong: resident.building,
      apartmentHo: resident.unitNumber,
      contact: resident.contact,
      name: resident.name,
      isHouseholder: resident.isHouseholder === IsHouseholder.HOUSEHOLDER,
    }));

    return await this.prisma.residentList.createMany({
      data: residents,
      skipDuplicates: true,
    });
  }

  // db에 있는 세대주 조회
  async findHouseholdersByAddresses(
    apartmentId: string,
    addresses: { building: string; unitNumber: string }[],
  ) {
    return this.prisma.residentList.findMany({
      where: {
        apartmentId,
        isHouseholder: true,
        OR: addresses.map((a) => ({
          apartmentDong: a.building,
          apartmentHo: a.unitNumber,
        })),
      },
      select: {
        apartmentDong: true,
        apartmentHo: true,
      },
    });
  }
}
