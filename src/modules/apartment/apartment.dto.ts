import { Apartment } from '@prisma/client';

// 아파트 DTO
export type ApartmentDto = Omit<Apartment, 'createdAt' | 'updatedAt' | 'deletedAt'>;

// 아파트 생성 DTO
export type CreateApartmentDto = Omit<
  Apartment,
  'id' | 'apartmentStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {};
// 아파트 출력값 (입주자, 비로그인)
export type ApartmentPublicDto = {
  id: string; // 아파트 고유 ID (uuid)
  name: string; // 아파트 이름
  address: string; // 아파트 주소
};

// 아파트 목록 출력값 (입주자, 비로그인)
export type ApartmentListPublicDto = {
  apartments: ApartmentPublicDto[]; // 아파트 목록
  totalCount: number; // 아파트 총 개수
};

export type ApartmentResponseDto = Omit<Apartment, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  adminId: string; // 아파트 관리자 ID
  adminName: string; // 아파트 관리자 이름
  adminContact: string; // 아파트 관리자 연락처
  adminEmail: string; // 아파트 관리자 이메일
};

export type ApartmentListResponseDto = {
  apartments: ApartmentResponseDto[]; // 아파트 목록
  totalCount: number; // 아파트 총 개수
};

export type ApartmentRangeDto = {
  start: string;
  end: string;
};

export type ApartmentResponseWithRangeDto = ApartmentResponseDto & {
  dongRange: ApartmentRangeDto; // 아파트 범위 정보
  hoRange: ApartmentRangeDto; // 아파트 범위 정보
};

export type ApartmentResponseWithRangePublicDto = Omit<
  Apartment,
  'officeNumber' | 'apartmentStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  dongRange: ApartmentRangeDto; // 아파트 범위 정보
  hoRange: ApartmentRangeDto; // 아파트 범위 정보
};
