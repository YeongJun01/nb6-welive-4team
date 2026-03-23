import { Infer } from 'superstruct';
import userStruct from './user.validation';

export type SignUpDto = Infer<typeof userStruct.signUp>;

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}
