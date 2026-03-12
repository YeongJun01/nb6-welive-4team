import { ResidentList } from '@prisma/client';

// 입주자 명부 DTO
export type ResidentListDto = Omit<ResidentList, 'createdAt' | 'updatedAt' | 'deletedAt'>;

// enum residentStatus: 거주 상태
export enum ResidentStatus {
  RESIDENCE = 'RESIDENCE', // 거주 중
  NO_RESIDENCE = 'NO_RESIDENCE', // 거주하지 않음
}

// enum isHouseholder: 세대주 여부
export enum IsHouseholder {
  HOUSEHOLDER = 'HOUSEHOLDER', // 세대주
  MEMBER = 'MEMBER', // 세대원
}

// enum approvalStatus: 승인 상태
export enum ApprovalStatus {
  PENDING = 'PENDING', // 승인 대기
  APPROVED = 'APPROVED', // 승인 완료
  REJECTED = 'REJECTED', // 승인 거절
}

// 입주자 조회 DTO
export type GetResidentDto = {
  id: ResidentList['id']; // 입주자 명부 고유 ID (uuid)
  userId: ResidentList['userId']; // 입주자 명부 작성자 ID (uuid)
  building: ResidentList['apartmentDong']; // 동
  unitNumber: ResidentList['apartmentHo']; // 호
  contact: ResidentList['contact']; // 연락처
  name: ResidentList['name']; // 이름
  email: ResidentList['email']; // 이메일
  residenceStatus: ResidentStatus; // 거주 상태 (예: 거주 중, 퇴거 예정, 퇴거 완료)
  isHouseholder: IsHouseholder; // 세대주 여부 (예: 세대주, 세대원)
  isRegistered: ResidentList['isRegistered']; // 주민등록 여부
  approvalStatus: ApprovalStatus; // 승인 상태 (예: 승인 대기, 승인 완료, 승인 거절)
};

// 입주자 명부 전체 조회 DTO
export type GetResidentListDto = {
  residents: GetResidentDto[];
  message: string;
  count: number;
  totalCount: number;
};

// 입주자 개별 생성 입력
export type CreateResidentDto = {
  building: ResidentList['apartmentDong'];
  unitNumber: ResidentList['apartmentHo'];
  contact: ResidentList['contact'];
  name: ResidentList['name'];
  isHouseholder: IsHouseholder;
};
