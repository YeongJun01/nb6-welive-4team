import { PrismaClient, Prisma, Status, User } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 1. 고유 정보로 유저 찾기 (아이디, 이메일, 연락처 중복 검사 및 로그인 시 활용)
   */
  async findUserByUnique(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({
      where,
    });
  }

  /**
   * 2. 회원가입 (신규 유저 생성)
   */
  async createUser(data: Prisma.UserCreateInput) {
    return await this.prisma.user.create({
      data,
    });
  }

  /**
   * 3. 유저 개인정보 및 프로필 수정
   */
  async updateUser(userId: User['id'], data: Prisma.UserUpdateInput) {
    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * 4. 회원가입 승인/거절 상태 변경 (관리자 또는 슈퍼관리자가 수행)
   */
  async updateUserJoinStatus(userId: User['id'], status: Status) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { joinStatus: status },
    });
  }

  /**
   * 5. 특정 권한의 거절(REJECTED) 상태인 계정들 일괄 삭제
   */
  async deleteRejectedUsersByRole(role: User['role']) {
    return await this.prisma.user.deleteMany({
      where: { role, joinStatus: Status.REJECTED },
    });
  }
}
