import prisma from '../../lib/prisma';

class ResidentListRepository {
  // 입주자 명부 전체 조회
  async getResidentList() {
    const residents = await prisma.residentList.findMany({
      where: {
        deletedAt: null, // 삭제되지 않은 입주자 명부만 조회
      },
    });

    const count = residents.length; // 현재 페이지의 입주자 수
    const totalCount = await prisma.residentList.count({
      where: {
        deletedAt: null, // 삭제되지 않은 입주자 명부만 카운트
      },
    });

    return {
      residents,
      message: `조회된 입주민 결과가 총 ${count}명입니다.`,
      count,
      totalCount,
    };
  }
}

export default new ResidentListRepository();
