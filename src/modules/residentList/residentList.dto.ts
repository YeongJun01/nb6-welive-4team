import { ResidentList } from '@prisma/client';

// 입주자 명부 DTO
export type ResidentListDto = Omit<ResidentList, 'createdAt' | 'updatedAt' | 'deletedAt'>;

// enum residentStatus: 거주 상태
export enum ResidentStatus {
  RESIDENCE, // 거주 중
  NO_RESIDENCE, // 거주하지 않음
}

// enum isHouseholder: 세대주 여부
export enum IsHouseholder {
  HOUSEHOLDER, // 세대주
  MEMBER, // 세대원
}

// enum approvalStatus: 승인 상태
export enum ApprovalStatus {
  PENDING, // 승인 대기
  APPROVED, // 승인 완료
  REJECTED, // 승인 거절
}

// 입주자 조회 DTO
export type GetResidentDto = {
  id: string; // 입주자 명부 고유 ID (uuid)
  userId: string | null; // 입주자 명부 작성자 ID (uuid)
  building: string; // 동
  unitNumber: string; // 호
  contact: string; // 연락처
  name: string; // 이름
  email: string | null; // 이메일
  residenceStatus: string; // 거주 상태 (예: 거주 중, 퇴거 예정, 퇴거 완료)
  isHouseholder: string; // 세대주 여부 (예: 세대주, 세대원)
  isRegistered: boolean; // 주민등록 여부
  approvalStatus: string; // 승인 상태 (예: 승인 대기, 승인 완료, 승인 거절)
};

// 입주자 명부 전체 조회 DTO
export type GetResidentListDto = {
  residents: GetResidentDto[];
  message: string;
  count: number;
  totalCount: number;
};
