import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import apartmentRepository from '../apartment/apartment.repository';
import { UserRepository } from '../user';
import { CreateResidentDto, ResidentStatus } from './residentList.dto';
import { ResidentListRepository } from './residentList.repository';

export class ResidentListService {
  constructor(
    private readonly residentListRepository: ResidentListRepository,
    private readonly userRepository: UserRepository,
  ) {}

  // 입주자 목록 조회
  async getResidentsList(
    userId: string,
    query?: {
      page?: number;
      limit?: number;
      building?: string;
      unitNumber?: string;
      isRegistered?: boolean;
      keyword?: string;
    },
  ) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }

    const apartmentId = user.apartmentId;
    if (!apartmentId) {
      throw new NotFoundError('사용자의 아파트 정보를 찾을 수 없습니다.');
    }
    const { residents, totalCount } = await this.residentListRepository.getResidentsList(
      apartmentId,
      query || {},
    );

    return {
      residents,
      message: `조회된 입주민 결과가 ${residents.length}건 입니다.`,
      count: residents.length,
      totalCount,
    };
  }

  // 입주자 개별 생성
  async createResident(userId: string, data: CreateResidentDto) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }

    const apartmentId = user.apartmentId;
    if (!apartmentId) {
      throw new NotFoundError('사용자의 아파트 정보를 찾을 수 없습니다.');
    }

    // 중복 검증
    const duplicateResident = await this.residentListRepository.findDuplicateResident(
      apartmentId,
      data.building,
      data.unitNumber,
      data.name,
      data.contact,
    );

    if (duplicateResident) {
      throw new ConflictError('이미 등록된 입주민입니다.');
    }

    const resident = await this.residentListRepository.createResident(apartmentId, data);

    return {
      id: resident.id,
      userId: resident.userId,
      building: resident.apartmentDong,
      unitNumber: resident.apartmentHo,
      contact: resident.contact,
      name: resident.name,
      email: resident.email,
      residenceStatus: ResidentStatus.RESIDENCE,
      isHouseholder: resident.isHouseholder, // boolean으로 나오긴 함
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
    };
  }

  // 사용자로부터 입주민 명부 생성 -- 보류
  async createResidentFromUser(userId: string, adminId: string) {
    // 유저 추출
    const user = await this.userRepository.findUserByUnique({ id: userId });
    // 유저 검증
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자 추출
    const admin = await this.userRepository.findUserByUnique({ id: adminId });
    // 관리자 검증
    if (!admin) {
      throw new NotFoundError('관리자를 찾을 수 없습니다.');
    }

    const apartmentId = admin.apartmentId;
    if (!apartmentId) {
      throw new NotFoundError('사용자의 아파트 정보를 찾을 수 없습니다.');
    }

    // 유저의 아파트 추출
    const userApt = await apartmentRepository.getApartmentById(apartmentId);
    // 유저의 아파트 검증
    if (!userApt) {
      throw new NotFoundError('사용자의 아파트를 찾을 수 없습니다.');
    }

    // 입주자 생성
  }

  // 입주민 상세 조회
  async getResidentById(userId: string, residentId: string) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }

    const resident = await this.residentListRepository.getResidentById(residentId);
    if (!resident) {
      throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    let residenceStatus;
    if (resident.isRegistered) {
      residenceStatus = ResidentStatus.RESIDENCE;
    } else {
      residenceStatus = ResidentStatus.NO_RESIDENCE;
    }

    const result = {
      id: resident.id,
      userId: resident.userId,
      building: resident.apartmentDong,
      unitNumber: resident.apartmentHo,
      contact: resident.contact,
      name: resident.name,
      email: resident.email,
      residenceStatus,
      IsHouseholder: resident.isHouseholder,
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
    };

    return result;
  }

  // 입주민 정보 수정
  async updateResident(userId: string, residentId: string, data: CreateResidentDto) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }
    // 존재하는 입주자인지 확인
    const resident = await this.residentListRepository.getResidentById(residentId);

    if (!resident) {
      throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    await this.residentListRepository.updateResident(residentId, data);

    let residenceStatus;
    if (resident.isRegistered) {
      residenceStatus = ResidentStatus.RESIDENCE;
    } else {
      residenceStatus = ResidentStatus.NO_RESIDENCE;
    }

    const result = {
      id: resident.id,
      userId: resident.userId,
      building: resident.apartmentDong,
      unitNumber: resident.apartmentHo,
      contact: resident.contact,
      name: resident.name,
      email: resident.email,
      residenceStatus,
      IsHouseholder: resident.isHouseholder,
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
    };

    return result;
  }

  // 입주민 정보 삭제
  async deleteResident(userId: string, residentId: string) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }

    // 존재하는 입주자인지 확인
    const resident = await this.residentListRepository.getResidentById(residentId);

    if (!resident) {
      throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    await this.residentListRepository.deleteResident(residentId);
    return { message: '입주민 정보가 성공적으로 삭제되었습니다.' };
  }

  // 입주민 정보 삭제 (soft delete)
  async softDeleteResident(userId: string, residentId: string) {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('관리자가 아닙니다.');
    }
    // 존재하는 입주자인지 확인
    const resident = await this.residentListRepository.getResidentById(residentId);

    if (!resident) {
      throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    await this.residentListRepository.softDeleteResident(residentId);
    return { message: '입주민 정보가 성공적으로 삭제되었습니다. (soft delete)' };
  }
}
