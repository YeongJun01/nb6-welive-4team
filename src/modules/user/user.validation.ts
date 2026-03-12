import * as s from 'superstruct';

// 공통 회원가입 필드
const signUpBase = {
  username: s.string(),
  password: s.string(),
  name: s.string(),
  email: s.string(),
  contact: s.string(),
  avatar: s.optional(s.string()),
};

// 일반 사용자 회원가입 - 아파트 정보 필수
const signUpUser = s.object({
  ...signUpBase,
  role: s.literal('USER'),
  apartmentId: s.string(),
  apartmentDong: s.string(),
  apartmentHo: s.string(),
});

// 관리자 회원가입 - 아파트 정보 선택
const signUpAdmin = s.object({
  ...signUpBase,
  role: s.literal('ADMIN'),
  apartmentId: s.optional(s.string()),
});

// 슈퍼관리자 회원가입 - 아파트 정보 없음
const signUpSuperAdmin = s.object({
  ...signUpBase,
  role: s.literal('SUPER_ADMIN'),
});

// 내부 공용 타입 (service layer용)
const signUp = s.object({
  ...signUpBase,
  role: s.enums(['USER', 'ADMIN', 'SUPER_ADMIN']),
  apartmentId: s.optional(s.string()),
  apartmentDong: s.optional(s.string()),
  apartmentHo: s.optional(s.string()),
});

const updateProfile = s.object({
  name: s.optional(s.string()),
  email: s.optional(s.string()),
  contact: s.optional(s.string()),
  avatar: s.optional(s.string()),
});

const updatePassword = s.object({
  currentPassword: s.string(),
  newPassword: s.string(),
});

const updateStatusById = s.object({
  status: s.enums(['PENDING', 'APPROVED', 'REJECTED', 'NEED_UPDATE', 'MOVED_OUT']),
});

const updateStatusBulk = s.object({
  status: s.enums(['PENDING', 'APPROVED', 'REJECTED', 'NEED_UPDATE', 'MOVED_OUT']),
});

const updateAdminInfo = s.object({
  name: s.optional(s.string()),
  email: s.optional(s.string()),
  contact: s.optional(s.string()),
  avatar: s.optional(s.string()),
  apartmentId: s.optional(s.string()),
});

const deleteRejectedUsers = s.object({
  role: s.enums(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

export default {
  signUp,
  signUpUser,
  signUpAdmin,
  signUpSuperAdmin,
  updateProfile,
  updatePassword,
  updateStatusById,
  updateStatusBulk,
  updateAdminInfo,
  deleteRejectedUsers,
};
