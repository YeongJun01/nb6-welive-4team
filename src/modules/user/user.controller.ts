import { Prisma, Status, User } from '@prisma/client';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { SignUpDto } from './user.dto';
import { UpdatePasswordDto } from './user.dto';

export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 1. 회원가입
   */
  async signUp(req: Request, res: Response) {
    const signUpDto: SignUpDto = req.body;
    const user = await this.userService.signUp(signUpDto);
    const { password, ...userWithoutPassword } = user;
    res.status(201).json({ message: '회원가입 성공', user: userWithoutPassword });
  }

  /**
   * 2. 내 프로필 수정
   */
  async updateProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const updateData: Prisma.UserUpdateInput = req.body;

    const updatedUser = await this.userService.updatedProfile(userId, updateData);

    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({ message: '프로필 수정 성공', user: userWithoutPassword });
  }

  /**
   * 3. 비밀번호 변경
   */
  async updatePassword(req: Request, res: Response) {
    const userId = req.user!.id;
    const updateData: UpdatePasswordDto = req.body;

    await this.userService.updatePassword(userId, updateData);
    res.status(200).json({ message: '비밀번호 변경 성공' });
  }

  /**
   * 4. 회원가입 승인/거절 상태 변경(관리자 전용)
   */
  async updateJoinStatus(req: Request, res: Response) {
    const adminId = req.user!.id;
    const { userId, status, role } = req.body as {
      userId: User['id'];
      status: Status;
      role: User['role'];
    };
    const updatedUser = await this.userService.updateUserJoinStatus(adminId, userId, status, role);

    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({ message: '가입 상태 변경 성공', user: userWithoutPassword });
  }

  /**
   * 5. 거절된(Rejected) 회원 일괄 삭제(관리자 전용)
   */
  async deleteRejectedUsers(req: Request, res: Response) {
    const adminId = req.user!.id;
    const { role } = req.body as { role: User['role'] };

    const result = await this.userService.deleteRejectedUsersByRole(adminId, role);
    res.status(200).json({ message: `${result.count}명의 거절된 회원이 삭제되었습니다.` });
  }
}
