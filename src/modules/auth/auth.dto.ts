import { Prisma } from '@prisma/client';

export interface LoginDto {
  email: Prisma.UserCreateInput['email'];
  password: Prisma.UserCreateInput['password'];
}
