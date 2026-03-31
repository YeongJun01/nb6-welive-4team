import prisma from '../../lib/prisma';
import { Prisma, Status, User } from '@prisma/client';
import { UnauthorizedError, ConflictError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { UserRepository } from './';
import { ResidentListRepository } from '../residentList/residentList.repository';
import { ResidentListService } from '../residentList/residentList.service';
import { SignUpDto, UpdatePasswordDto } from './user.dto';
import { NotificationRepository } from '../notification/notification.repository';
import * as bcrypt from 'bcrypt';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly residentListRepository: ResidentListRepository,
    private readonly residentListService: ResidentListService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  /**
   * 1. 회원가입 프로세스
   * - 중복검사 (이메일, 연락처)
   * - 비밀번호 암호화(bcrypt 사용)
   * - [입주민일 경우] 입주민 명부와 정보 대조하여 일치하면 Status.APPROVED, 아니면 PENDING으로 저장
   * @param data
   */
  async signUp(data: SignUpDto) {
    // 1. 이메일 중복 체크
    const checkEmail = await this.userRepository.findUserByUnique({ email: data.email });
    if (checkEmail) {
      throw new ConflictError('이미 가입된 이메일입니다.');
    }

    // 2. 연락처 중복 체크
    const checkContact = await this.userRepository.findUserByUnique({ contact: data.contact });
    if (checkContact) {
      throw new ConflictError('이미 가입된 연락처입니다.');
    }

    // 아파트 이름으로 id 추출
    let aptId: string | undefined;
    if (data.role === 'USER') {
      if (data.apartmentName) {
        const apartment = await this.userRepository.findApartmentByName(data.apartmentName);
        if (!apartment) {
          throw new NotFoundError('존재하지 않는 아파트입니다.');
        }
        aptId = apartment.id;
      }
    }
    // 3. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. 입주민 자동 승인 로직
    let currentJoinStatus: Status = Status.PENDING; // default: '승인 대기'

    let matchedResidentId: string | null = null;
    if (data.role === 'USER' && aptId && data.apartmentDong && data.apartmentHo) {
      const resident = await this.residentListRepository.findResidentByUnique({
        apartmentId: aptId,
        apartmentDong: data.apartmentDong,
        apartmentHo: data.apartmentHo,
        contact: data.contact,
        name: data.name,
      });
      if (resident) {
        currentJoinStatus = Status.APPROVED;
        matchedResidentId = resident.id;
      }
    }

    const {
      apartmentDong,
      apartmentHo,
      apartmentName,
      apartmentAddress,
      apartmentManagementNumber,
      description,
      startComplexNumber,
      endComplexNumber,
      startBuildingNumber,
      endBuildingNumber,
      startFloorNumber,
      endFloorNumber,
      startUnitNumber,
      endUnitNumber,
      ...userData
    } = data;

    // 아파트 ID가 있으면 존재 여부 확인
    let finalApartmentId = aptId;

    // ADMIN 가입 시 아파트 함께 생성
    if (data.role === 'ADMIN' && apartmentName) {
      const newApartment = await prisma.apartment.create({
        data: {
          name: apartmentName,
          address: apartmentAddress!,
          officeNumber: apartmentManagementNumber!,
          description: description!,
          //startComplexNumber: 1,
          endComplexNumber: endComplexNumber!,
          //startBuildingNumber: 1,
          endBuildingNumber: endBuildingNumber!,
          //startFloorNumber: 1,
          endFloorNumber: endFloorNumber!,
          //startUnitNumber: 1,
          endUnitNumber: endUnitNumber!,
        },
      });
      finalApartmentId = newApartment.id;
    }

    // DB 저장
    const newUser = await this.userRepository.createUser({
      ...userData,
      password: hashedPassword,
      joinStatus: currentJoinStatus,
      apartment: finalApartmentId ? { connect: { id: finalApartmentId } } : undefined,
    });

    // ADMIN 가입 시 기본 Board 3개 생성 (NOTICE, COMPLAINT, POLL)
    if (data.role === 'ADMIN' && finalApartmentId) {
      await this.userRepository.createDefaultBoards(finalApartmentId, newUser.id);
    }

    if (finalApartmentId && !data.role.includes('ADMIN')) {
      const apartment = await this.userRepository.findApartmentById(finalApartmentId);
      if (!apartment) throw new NotFoundError('존재하지 않는 아파트입니다.');
    }

    // 입주민 명부에 userId 연결
    if (matchedResidentId) {
      await this.residentListRepository.updateResidentUserId(matchedResidentId, newUser.id);
    } else if (data.role === 'USER') {
      await this.residentListService.createResidentFromSignUp(newUser.id, data);
    }

    // 회원가입 알림 전송
    const notiData = {
      notiType: 'SIGNUP_REQ' as const,
      title: '새로운 회원가입 신청',
      content: `${newUser.name}님이 회원가입을 신청했습니다.`,
      url: '/auth/signup',
    };

    if (newUser.role === 'ADMIN') {
      // 관리자 가입 -> 슈퍼관리자에게 알림
      const superAdmins = await this.userRepository.findUsersByRole('SUPER_ADMIN');
      for (const superAdmin of superAdmins) {
        await this.notificationRepository.createNotification(
          this.userRepository['prisma'],
          notiData,
          superAdmin.id,
        );
      }
    } else if (data.role === 'USER' && data.apartmentId) {
      // 입주민 가입 → 같은 아파트 관리자들에게 알림
      const admins = await this.userRepository.findAdminsByApartmentId(data.apartmentId);
      for (const admin of admins) {
        await this.notificationRepository.createNotification(
          this.userRepository['prisma'],
          notiData,
          admin.id,
        );
      }
    }

    return newUser;
  }

  /**
   * 2. 개인정보 수정 (아바타, 이름, 연락처 등)
   * @param userId
   * @param updateData
   */
  async updatedProfile(userId: User['id'], updateData: any, file?: Express.Multer.File) {
    // 1. 본인확인
    const checkUser = await this.userRepository.findUserByUnique({ id: userId });
    if (!checkUser) {
      throw new NotFoundError('해당 사용자가 없습니다.');
    }

    // ✅ 비밀번호 변경
    if (updateData.currentPassword && updateData.newPassword) {
      const isValid = await bcrypt.compare(
        updateData.currentPassword as string,
        checkUser.password,
      );

      if (!isValid) {
        throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
      }

      updateData.password = await bcrypt.hash(updateData.newPassword as string, 10);

      // 👇 DB에 쓸 필요 없는 값 제거
      delete updateData.currentPassword;
      delete updateData.newPassword;
    }

    // ✅ 프로필 이미지
    if (file) {
      const uploadedFile = file as Express.Multer.File & { location?: string };

      updateData.avatar = uploadedFile.location || `/uploads/${uploadedFile.filename}`;
    }

    return await this.userRepository.updateUser(userId, updateData);
  }

  /**
   * 3. 비밀번호 변경(현재 비밀번호 2차 검증 필수)
   * @param userId
   * @param updateData
   */
  async updatePassword(userId: User['id'], updateData: UpdatePasswordDto) {
    // 1. 본인 확인(ID찾기)
    const checkUser = await this.userRepository.findUserByUnique({ id: userId });
    if (!checkUser) {
      throw new NotFoundError('해당 사용자가 없습니다.');
    }

    // 2. 현재 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(updateData.currentPassword, checkUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
    }

    // 3. 새 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(updateData.newPassword, 10);

    // 4. DB 업데이트
    return await this.userRepository.updateUser(userId, { password: hashedPassword });
  }

  /**
   * 4.가입승인
   * - 슈퍼관리자(SUPERADMIN) -> 관리자(ADMIN) 승인 가능
   * - 관리자(ADMIN) -> 입주민(USER) 승인 가능
   * @param requestId
   * @param userId
   * @param status
   * @param role
   */
  async updateUserJoinStatus(
    requestId: User['id'],
    userId: User['id'],
    status: Status,
    role: User['role'],
  ) {
    // 1. 요청자 확인
    const requestUser = await this.userRepository.findUserByUnique({ id: requestId });
    if (!requestUser) {
      throw new NotFoundError('요청자가 존재하지 않습니다.');
    }

    // 2. 대상 유저 확인
    let targetUser: any | null = null;
    if (role === 'USER') {
      targetUser = await this.residentListRepository.getResidentById(userId);
      if (!targetUser) {
        throw new NotFoundError('대상 유저가 존재하지 않습니다.');
      }
      userId = targetUser.userId!; // residentList에서 userId 추출하여 재할당
    } else {
      targetUser = await this.userRepository.findUserByUnique({ id: userId });
      if (!targetUser) {
        throw new NotFoundError('대상 유저가 존재하지 않습니다.');
      }
    }
    // 2. 권한 검증
    const isAuthorized =
      (requestUser.role === 'ADMIN' && role === 'USER') ||
      (requestUser.role === 'SUPER_ADMIN' && role === 'ADMIN');

    if (!isAuthorized) {
      throw new ForbiddenError('권한이 없습니다.');
    }

    // 3. 승인/거절 처리
    if (requestUser.role === 'SUPER_ADMIN') {
      await this.userRepository.updateApartmentStatus(targetUser.apartmentId!, status);
    } else if (requestUser.role === 'ADMIN') {
      await this.userRepository.updateResidentStatus(targetUser.id, status);
    }
    return await this.userRepository.updateUserJoinStatus(userId, status);
  }

  /**
   * 5. 가입 상태 일괄 변경
   */
  async updateManyJoinStatus(requestId: User['id'], role: User['role'], status: Status) {
    const requestUser = await this.userRepository.findUserByUnique({ id: requestId });
    if (!requestUser) throw new NotFoundError('요청자가 존재하지 않습니다.');

    const isAuthorized =
      (requestUser.role === 'ADMIN' && role === 'USER') ||
      (requestUser.role === 'SUPER_ADMIN' && role === 'ADMIN');
    if (!isAuthorized) throw new ForbiddenError('권한이 없습니다.');

    return await this.userRepository.updateManyJoinStatus(role, status);
  }

  /**
   * 6. 관리자 정보 수정 (슈퍼관리자 전용)
   */
  async updateAdminInfo(
    requestId: User['id'],
    adminId: User['id'],
    updateData: Prisma.UserUpdateInput,
  ) {
    const requestUser = await this.userRepository.findUserByUnique({ id: requestId });
    if (!requestUser) throw new NotFoundError('요청자가 존재하지 않습니다.');
    if (requestUser.role !== 'SUPER_ADMIN')
      throw new ForbiddenError('슈퍼관리자만 수행할 수 있습니다.');

    const targetAdmin = await this.userRepository.findUserByUnique({ id: adminId });
    if (!targetAdmin) throw new NotFoundError('해당 관리자가 존재하지 않습니다.');
    if (targetAdmin.role !== 'ADMIN') throw new ForbiddenError('관리자 계정만 수정할 수 있습니다.');

    if (updateData.email) {
      const checkEmail = await this.userRepository.findUserByUnique({
        email: updateData.email as string,
      });
      if (checkEmail && checkEmail.id !== adminId)
        throw new ConflictError('이미 가입된 이메일입니다.');
    }

    if (updateData.contact) {
      const checkContact = await this.userRepository.findUserByUnique({
        contact: updateData.contact as string,
      });
      if (checkContact && checkContact.id !== adminId)
        throw new ConflictError('이미 가입된 연락처입니다.');
    }

    return await this.userRepository.updateUser(adminId, updateData);
  }

  /**
   * 7. 관리자 삭제 (슈퍼관리자 전용)
   */
  async deleteAdmin(requestId: User['id'], adminId: User['id']) {
    const requestUser = await this.userRepository.findUserByUnique({ id: requestId });
    if (!requestUser) throw new NotFoundError('요청자가 존재하지 않습니다.');
    if (requestUser.role !== 'SUPER_ADMIN')
      throw new ForbiddenError('슈퍼관리자만 수행할 수 있습니다.');

    const targetAdmin = await this.userRepository.findUserByUnique({ id: adminId });
    if (!targetAdmin) throw new NotFoundError('해당 관리자가 존재하지 않습니다.');
    if (targetAdmin.role !== 'ADMIN') throw new ForbiddenError('관리자 계정만 삭제할 수 있습니다.');

    return await this.userRepository.softDeleteUser(adminId);
  }

  /**
   * 8. 거절된 회원 일괄 삭제
   */
  async deleteRejectedUsersByRole(requestId: User['id'], role: User['role']) {
    const requestUser = await this.userRepository.findUserByUnique({ id: requestId });
    if (!requestUser) throw new NotFoundError('요청자가 존재하지 않습니다.');

    const isAuthorized =
      (requestUser.role === 'ADMIN' && role === 'USER') ||
      (requestUser.role === 'SUPER_ADMIN' && role === 'ADMIN');
    if (!isAuthorized) throw new ForbiddenError('권한이 없습니다.');

    return await this.userRepository.deleteRejectedUsersByRole(role);
  }
}
