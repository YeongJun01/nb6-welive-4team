import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import apartmentRepository from '../apartment/apartment.repository';
import { UserRepository } from '../user';
import { CreateResidentDto, IsHouseholder, ResidentStatus } from './residentList.dto';
import { ResidentListRepository } from './residentList.repository';
import { parseCsv } from './parseCsv';
import fs from 'fs/promises';
import { SignUpDto } from '../user/user.dto';

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
    const formattedResidents = residents.map((resident) => {
      return {
        id: resident.id,
        userId: resident.userId,
        building: resident.apartmentDong,
        unitNumber: resident.apartmentHo,
        contact: resident.contact,
        name: resident.name,
        residenceStatus: resident.isRegistered
          ? ResidentStatus.RESIDENCE
          : ResidentStatus.NO_RESIDENCE,
        isHouseholder: resident.isHouseholder ? IsHouseholder.HOUSEHOLDER : IsHouseholder.MEMBER,
        isRegistered: resident.isRegistered,
        approvalStatus: resident.approvalStatus,
        email: resident.email,
      };
    });

    return {
      residents: formattedResidents,
      message: `조회된 입주민 결과가 ${formattedResidents.length}건 입니다.`,
      count: formattedResidents.length,
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
      apartmentId: resident.apartmentId,
      building: resident.apartmentDong,
      unitNumber: resident.apartmentHo,
      contact: resident.contact,
      name: resident.name,
      //email: resident.email,
      residenceStatus: resident.isRegistered
        ? ResidentStatus.RESIDENCE
        : ResidentStatus.NO_RESIDENCE,
      isHouseholder: resident.isHouseholder ? IsHouseholder.HOUSEHOLDER : IsHouseholder.MEMBER,
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
      createdAt: resident.createdAt,
      updatedAt: resident.updatedAt,
    };
  }

  // 회원가입 데이터로 명부 생성
  // /residents/from-user/{userId} 엔드포인트 사용 안 함 -> 로직에서 바로 함수 사용
  async createResidentFromSignUp(userId: string, data: SignUpDto) {
    if (!data.apartmentId) {
      throw new BadRequestError('아파트 정보가 필요합니다.');
    }

    if (!data.apartmentDong || !data.apartmentHo) {
      throw new BadRequestError('동/호수 정보가 필요합니다.');
    }

    // 이미 user.service에서 확인함
    // const duplicate = await this.residentListRepository.findResidentByUnique({
    //   apartmentId: data.apartmentId,
    //   apartmentDong: data.apartmentDong!,
    //   apartmentHo: data.apartmentHo!,
    //   name: data.name,
    //   contact: data.contact,
    // });

    // if (duplicate) {
    //   if (!duplicate.userId) {
    //     return await this.residentListRepository.updateResidentUserId(duplicate.id, userId);
    //   }
    //   return duplicate;
    // }

    await this.residentListRepository.createResidentFromSignUp(userId, data);
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

    const result = {
      id: resident.id,
      userId: resident.userId,
      apartmentId: resident.apartmentId,
      building: resident.apartmentDong,
      unitNumber: resident.apartmentHo,
      contact: resident.contact,
      name: resident.name,
      //email: resident.email,
      residenceStatus: resident.isRegistered
        ? ResidentStatus.RESIDENCE
        : ResidentStatus.NO_RESIDENCE,
      isHouseholder: resident.isHouseholder ? IsHouseholder.HOUSEHOLDER : IsHouseholder.MEMBER,
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
      createdAt: resident.createdAt,
      updatedAt: resident.updatedAt,
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

    const updatedResident = await this.residentListRepository.updateResident(residentId, data);

    const result = {
      id: resident.id,
      userId: resident.userId,
      apartmentId: resident.apartmentId,
      building: updatedResident.apartmentDong,
      unitNumber: updatedResident.apartmentHo,
      contact: updatedResident.contact,
      name: updatedResident.name,
      //email: resident.email,
      residenceStatus: resident.isRegistered
        ? ResidentStatus.RESIDENCE
        : ResidentStatus.NO_RESIDENCE,
      isHouseholder: updatedResident.isHouseholder
        ? IsHouseholder.HOUSEHOLDER
        : IsHouseholder.MEMBER,
      isRegistered: resident.isRegistered,
      approvalStatus: resident.approvalStatus,
      createdAt: resident.createdAt,
      updatedAt: updatedResident.updatedAt,
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

  // 입주민 정보 여러개 생성 (csv)
  async createResidentsByCsv(userId: string, file: Express.Multer.File) {
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

    const rows = await parseCsv(file.path);

    if (rows.length === 0) {
      throw new BadRequestError('CSV 파일이 비어 있습니다.');
    }

    const residents: CreateResidentDto[] = rows.map((row, index) => {
      if (!row['동'] || !row['호수'] || !row['이름']) {
        throw new BadRequestError(`${index + 1}번째 행 필수값 누락`);
      }

      const householder = String(row['세대주여부']).trim();

      if (!['HOUSEHOLDER', 'MEMBER'].includes(householder)) {
        throw new BadRequestError(`${index + 1}번째 행 세대주 타입 오류`);
      }

      return {
        building: String(row['동']).trim(),
        unitNumber: String(row['호수']).trim(),
        name: String(row['이름']).trim(),
        contact: row['연락처'] ? String(row['연락처']).trim() : '',
        isHouseholder: householder as IsHouseholder,
      };
    });

    // 같은 주소 세대주 중복 검사
    const householderCheck = new Set<string>();

    for (const r of residents) {
      if (r.isHouseholder === IsHouseholder.HOUSEHOLDER) {
        const key = `${r.building}-${r.unitNumber}`;

        if (householderCheck.has(key)) {
          throw new BadRequestError(`${r.building}동 ${r.unitNumber}호에 세대주가 중복되었습니다.`);
        }

        householderCheck.add(key);
      }
    }

    // DB에 이미 존재하는 세대주와 충돌 검사
    const addresses = residents
      .filter((r) => r.isHouseholder === IsHouseholder.HOUSEHOLDER)
      .map((r) => ({
        building: r.building,
        unitNumber: r.unitNumber,
      }));
    // 주소 중복 제거
    const uniqueAddresses = Array.from(
      new Map(addresses.map((a) => [`${a.building}-${a.unitNumber}`, a])).values(),
    );

    if (addresses.length > 0) {
      const existingHouseholders = await this.residentListRepository.findHouseholdersByAddresses(
        apartmentId,
        uniqueAddresses,
      );

      if (existingHouseholders.length > 0) {
        const conflict = existingHouseholders[0];

        throw new BadRequestError(
          `${conflict.apartmentDong}동 ${conflict.apartmentHo}호에 이미 세대주가 존재합니다.`,
        );
      }
    }

    const result = await this.residentListRepository.createManyResidents(apartmentId, residents);

    await fs.unlink(file.path);

    return {
      message: `${result.count}개의 입주민 정보가 성공적으로 생성되었습니다.`,
      count: result.count,
    };
  }

  // 입주민 목록 파일로 다운로드
  async exportResidentsToCsv(
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

    if (residents.length === 0) {
      throw new NotFoundError('입주민 명부가 없습니다.');
    }

    const header = '동,호수,이름,연락처,세대주여부';

    const rows = residents.map((r) =>
      [
        r.apartmentDong,
        r.apartmentHo,
        r.name,
        r.contact ?? '',
        r.isHouseholder ? 'HOUSEHOLDER' : 'MEMBER',
      ].join(','),
    );

    const csv = [header, ...rows].join('\n');

    return csv;
  }
}
