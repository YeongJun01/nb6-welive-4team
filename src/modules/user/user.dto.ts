import { User, ResidentList } from '@prisma/client';

export interface SignUpDto {
  username: User['username'];
  password: User['password'];
  contact: User['contact'];
  name: User['name'];
  email: User['email'];
  avatar: User['avatar'];
  role: User['role'];
  apartmentId: ResidentList['apartmentId'];
  apartmentDong: ResidentList['apartmentDong'];
  apartmentHo: ResidentList['apartmentHo'];
}

export interface UpdatePasswordDto {
  currentPassword: User['password'];
  newPassword: User['password'];
}
