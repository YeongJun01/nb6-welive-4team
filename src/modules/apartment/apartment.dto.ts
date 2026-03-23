import { Apartment, User } from '@prisma/client';

// 아파트 DTO
export type ApartmentDto = Omit<Apartment, 'createdAt' | 'updatedAt' | 'deletedAt'>;

// 아파트 생성 DTO
export type CreateApartmentDto = Omit<
  Apartment,
  'id' | 'apartmentStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {};
// 아파트 출력값 (입주자, 비로그인)
export type ApartmentPublicDto = {
  id: Apartment['id']; // 아파트 고유 ID (uuid)
  name: Apartment['name']; // 아파트 이름
  address: Apartment['address']; // 아파트 주소
};

// 아파트 목록 출력값 (입주자, 비로그인)
export type ApartmentListPublicDto = {
  apartments: ApartmentPublicDto[]; // 아파트 목록
  totalCount: number; // 아파트 총 개수
};

export type ApartmentResponseDto = {
  id: Apartment['id']; // 아파트 고유 ID (uuid)
  name: Apartment['name']; // 아파트 이름
  address: Apartment['address']; // 아파트 주소
  officeNumber: Apartment['officeNumber']; // 아파트 오피스 번호
  description: Apartment['description']; // 아파트 설명
  startComplexNumber: string; // 아파트 시작
  endComplexNumber: string; // 아파트 끝
  startDongNumber: string; // 아파트 시작
  endDongNumber: string; // 아파트 끝
  startFloorNumber: string; // 아파트 시작
  endFloorNumber: string; // 아파트 끝
  startHoNumber: string; // 아파트 시작
  endHoNumber: string; // 아파트 끝
  apartmentStatus: Apartment['apartmentStatus']; // 아파트 상태
  adminId: User['id']; // 아파트 관리자 ID
  adminName: User['name']; // 아파트 관리자 이름
  adminContact: User['contact']; // 아파트 관리자 연락처
  adminEmail: User['email']; // 아파트 관리자 이메일
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

export type ApartmentResponseWithRangePublicDto = {
  id: Apartment['id']; // 아파트 고유 ID (uuid)
  name: Apartment['name']; // 아파트 이름
  address: Apartment['address']; // 아파트 주소
  startComplexNumber: string; // 아파트 시작
  endComplexNumber: string; // 아파트 끝
  startDongNumber: string; // 아파트 시작
  endDongNumber: string; // 아파트 끝
  startFloorNumber: string; // 아파트 시작
  endFloorNumber: string; // 아파트 끝
  startHoNumber: string; // 아파트 시작
  endHoNumber: string;
  dongRange: ApartmentRangeDto; // 아파트 범위 정보
  hoRange: ApartmentRangeDto; // 아파트 범위 정보
};
