import { PrismaClient, Prisma, Status, User, BoardType } from '@prisma/client';

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

  /**
   * 6. 특정 권한의 계정들 가입 상태 일괄 변경
   */
  async updateManyJoinStatus(role: User['role'], status: Status) {
    return await this.prisma.user.updateMany({
      where: { role },
      data: { joinStatus: status },
    });
  }

  /**
   * 7. 단일 유저 소프트 삭제 (deletedAt 설정)
   */
  async softDeleteUser(userId: User['id']) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 8. 아파트 존재 여부 확인
   */
  async findApartmentById(apartmentId: string) {
    return await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });
  }

  /**
   * 9. 로그인용 유저 상세 조회 (apartment, boards, residentList 포함)
   */
  async findUserWithDetails(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({
      where,
      include: {
        apartment: {
          include: { boards: true },
        },
        residentLists: true,
      },
    });
  }

  /**
   * 10. 역할(role)로 유저 목록 조회
   */
  async findUsersByRole(role: User['role']) {
    return await this.prisma.user.findMany({
      where: { role, deletedAt: null },
    });
  }

  /**
   * 11. 아파트에 기본 Board 3개 생성 (NOTICE, COMPLAINT, POLL)
   */
  async createDefaultBoards(apartmentId: string, adminId: string) {
    const boardTypes = [BoardType.NOTICE, BoardType.COMPLAINT, BoardType.POLL];
    return await this.prisma.board.createMany({
      data: boardTypes.map((boardType) => ({
        apartmentId,
        adminId,
        boardType,
      })),
    });
  }

  /**
   * 12. 특정 아파트의 관리자 조회
   */
  async findAdminsByApartmentId(apartmentId: string) {
    return await this.prisma.user.findMany({
      where: { apartmentId, role: 'ADMIN', deletedAt: null },
    });
  }
}
