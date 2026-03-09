import { PrismaClient, Prisma } from '@prisma/client';

export class ResidentListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findResidentByUnique(where: Prisma.ResidentListWhereInput) {
    return await this.prisma.residentList.findFirst({ where });
  }
}
