import { Request, Response } from 'express';
import { create, mask } from 'superstruct';
import { UserService } from './user.service';
import userStruct from './user.validation';

export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /api/auth/signup - 일반 사용자 회원가입
   */
  async signUpUser(req: Request, res: Response) {
    const data = mask({ ...req.body, role: 'USER' }, userStruct.signUpUser);
    const user = await this.userService.signUp(data);
    const { id, name, email, joinStatus, role } = user;
    res.status(201).json({ id, name, email, joinStatus, role });
  }

  /**
   * POST /api/auth/signup/admin - 관리자 회원가입
   */
  async signUpAdmin(req: Request, res: Response) {
    const data = mask({ ...req.body, role: 'ADMIN' }, userStruct.signUpAdmin);
    const user = await this.userService.signUp(data);
    const { id, name, email, joinStatus, role, apartmentId } = user;
    res.status(201).json({ id, name, email, joinStatus, role, apartmentId });
  }

  /**
   * POST /api/auth/signup/super-admin - 슈퍼관리자 회원가입
   */
  async signUpSuperAdmin(req: Request, res: Response) {
    const data = mask({ ...req.body, role: 'SUPER_ADMIN' }, userStruct.signUpSuperAdmin);
    const user = await this.userService.signUp(data);
    const { id, name, email, joinStatus, role } = user;
    res.status(201).json({ id, name, email, joinStatus, role });
  }

  /**
   * PATCH /api/users/me - 내 프로필 수정
   */
  async updateProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const updateData = mask(req.body, userStruct.updateProfile);
    const updatedUser = await this.userService.updatedProfile(userId, updateData);
    res.status(200).json({
      message: `${updatedUser.name}님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.`,
    });
  }

  /**
   * PATCH /api/users/password - 비밀번호 변경
   */
  async updatePassword(req: Request, res: Response) {
    const userId = req.user!.id;
    const updateData = create(req.body, userStruct.updatePassword);
    const userData = await this.userService.updatePassword(userId, updateData);
    res
      .status(200)
      .json({ message: `${userData.name}님의 비밀번호가 변경되었습니다. 다시 로그인해주세요.` });
  }

  /**
   * PATCH /api/auth/admins/:adminId/status - 관리자 가입 상태 변경 (단건, 슈퍼관리자 전용)
   */
  async updateAdminStatus(req: Request, res: Response) {
    const requestId = req.user!.id;
    const adminId = req.params.adminId as string;
    const { status } = create(req.body, userStruct.updateStatusById);
    await this.userService.updateUserJoinStatus(requestId, adminId, status, 'ADMIN');
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * PATCH /api/auth/admins/status - 관리자 가입 상태 일괄 변경 (슈퍼관리자 전용)
   */
  async updateAdminStatusBulk(req: Request, res: Response) {
    const requestId = req.user!.id;
    const { status } = create(req.body, userStruct.updateStatusBulk);
    await this.userService.updateManyJoinStatus(requestId, 'ADMIN', status);
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * PATCH /api/auth/residents/:residentId/status - 주민 가입 상태 변경 (단건, 관리자 전용)
   */
  async updateResidentStatus(req: Request, res: Response) {
    const requestId = req.user!.id;
    const residentId = req.params.residentId as string;
    const { status } = create(req.body, userStruct.updateStatusById);
    await this.userService.updateUserJoinStatus(requestId, residentId, status, 'USER');
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * PATCH /api/auth/residents/status - 주민 가입 상태 일괄 변경 (관리자 전용)
   */
  async updateResidentStatusBulk(req: Request, res: Response) {
    const requestId = req.user!.id;
    const { status } = create(req.body, userStruct.updateStatusBulk);
    await this.userService.updateManyJoinStatus(requestId, 'USER', status);
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * PATCH /api/auth/admins/:adminId - 관리자 정보 수정 (슈퍼관리자 전용)
   */
  async updateAdminInfo(req: Request, res: Response) {
    const requestId = req.user!.id;
    const adminId = req.params.adminId as string;
    const updateData = mask(req.body, userStruct.updateAdminInfo);
    const { apartmentId, ...rest } = updateData;
    await this.userService.updateAdminInfo(requestId, adminId, {
      ...rest,
      ...(apartmentId ? { apartment: { connect: { id: apartmentId } } } : {}),
    });
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * DELETE /api/auth/admins/:adminId - 관리자 삭제 (슈퍼관리자 전용)
   */
  async deleteAdmin(req: Request, res: Response) {
    const requestId = req.user!.id;
    const adminId = req.params.adminId as string;
    await this.userService.deleteAdmin(requestId, adminId);
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }

  /**
   * POST /api/auth/cleanup - 거절 계정 일괄 삭제
   */
  async deleteRejectedUsers(req: Request, res: Response) {
    const requestId = req.user!.id;
    const { role } = create(req.body, userStruct.deleteRejectedUsers);
    await this.userService.deleteRejectedUsersByRole(requestId, role);
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  }
}
