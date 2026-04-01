import apartmentRepository from './apartment.repository';
import {
  ApartmentListPublicDto,
  ApartmentListResponseDto,
  CreateApartmentDto,
  ApartmentResponseWithRangeDto,
  ApartmentResponseWithRangePublicDto,
} from './apartment.dto';

class ApartmentService {
  // [Q1] 입주자/비로그인 유저용 아파트 목록 조회 (공개 정보만)
  async getApartmentsForPublic(params?: {
    keyword?: string;
    name?: string;
    address?: string;
  }): Promise<ApartmentListPublicDto> {
    // 1. 레포지토리에서 전체 아파트 목록 추출
    const apartments = await apartmentRepository.getApartments(params);

    // 2. 가져온 데이터를 ApartmentPublicDto 형태로 변환
    const publicApartments = apartments.map((apt) => {
      return {
        id: apt.id,
        name: apt.name,
        address: apt.address,
      };
    });

    // 3. 결과 반환
    return {
      apartments: publicApartments,
      totalCount: publicApartments.length,
    };
  }

  // 슈퍼관리자용: 모든 아파트 목록 조회
  async getAllApartmentsForSuperAdmin(params?: {
    keyword?: string;
    name?: string;
    address?: string;
  }): Promise<ApartmentListResponseDto> {
    const apartments = await apartmentRepository.getApartments(params);

    const adminApartments = apartments.map((apt) => {
      return {
        id: apt.id,
        name: apt.name,
        address: apt.address,
        officeNumber: apt.officeNumber,
        description: apt.description,
        startComplexNumber: String(apt.startComplexNumber).padStart(2, '0'),
        endComplexNumber: String(apt.endComplexNumber).padStart(2, '0'),
        startDongNumber: String(apt.startBuildingNumber).padStart(2, '0'),
        endDongNumber: String(apt.endBuildingNumber).padStart(2, '0'),
        startFloorNumber: String(apt.startFloorNumber).padStart(2, '0'),
        endFloorNumber: String(apt.endFloorNumber).padStart(2, '0'),
        startHoNumber: String(apt.startUnitNumber).padStart(2, '0'),
        endHoNumber: String(apt.endUnitNumber).padStart(2, '0'),
        apartmentStatus: apt.apartmentStatus,
        adminId: apt.users[0].id,
        adminName: apt.users[0].name,
        adminContact: apt.users[0].contact,
        adminEmail: apt.users[0].email,
      };
    });

    return {
      apartments: adminApartments,
      totalCount: adminApartments.length,
    };
  }

  // 일반 관리자용: 자신이 속한 아파트 1개 조회
  async getApartmentForAdmin(
    adminId: string,
    params?: { keyword?: string; name?: string; address?: string },
  ): Promise<ApartmentListResponseDto> {
    // 1. 레포지토리에서 관리자 ID로 아파트를 조회
    const apt = await apartmentRepository.getApartmentByAdminId(adminId, params);

    // 2. 아파트가 존재하지 않으면 빈 목록을 반환
    if (!apt) {
      return { apartments: [], totalCount: 0 };
    }

    // 3. 조회된 아파트 정보를 DTO에 맞게 매핑
    const managedApartment = {
      id: apt.id,
      name: apt.name,
      address: apt.address,
      officeNumber: apt.officeNumber,
      description: apt.description,
      startComplexNumber: String(apt.startComplexNumber).padStart(2, '0'),
      endComplexNumber: String(apt.endComplexNumber).padStart(2, '0'),
      startDongNumber: String(apt.startBuildingNumber).padStart(2, '0'),
      endDongNumber: String(apt.endBuildingNumber).padStart(2, '0'),
      startFloorNumber: String(apt.startFloorNumber).padStart(2, '0'),
      endFloorNumber: String(apt.endFloorNumber).padStart(2, '0'),
      startHoNumber: String(apt.startUnitNumber).padStart(2, '0'),
      endHoNumber: String(apt.endUnitNumber).padStart(2, '0'),
      apartmentStatus: apt.apartmentStatus,
      adminId: apt.users[0].id,
      adminName: apt.users[0].name,
      adminContact: apt.users[0].contact,
      adminEmail: apt.users[0].email,
    };

    return { apartments: [managedApartment], totalCount: 1 };
  }

  // 아파트 상세 조회 (공개 정보)
  async getApartmentByIdForPublic(id: string): Promise<ApartmentResponseWithRangePublicDto | null> {
    if (!id) {
      return null;
    }

    const apartment = await apartmentRepository.getApartmentById(id);

    if (!apartment) {
      return null;
    }

    return {
      id: apartment.id,
      name: apartment.name,
      address: apartment.address,
      startComplexNumber: String(apartment.startComplexNumber).padStart(2, '0'),
      endComplexNumber: String(apartment.endComplexNumber).padStart(2, '0'),
      startDongNumber: String(apartment.startBuildingNumber).padStart(2, '0'),
      endDongNumber: String(apartment.endBuildingNumber).padStart(2, '0'),
      startFloorNumber: String(apartment.startFloorNumber).padStart(2, '0'),
      endFloorNumber: String(apartment.endFloorNumber).padStart(2, '0'),
      startHoNumber: String(apartment.startUnitNumber).padStart(2, '0'),
      endHoNumber: String(apartment.endUnitNumber).padStart(2, '0'),
      dongRange: {
        start: `${String(apartment.startComplexNumber)}${String(apartment.startBuildingNumber).padStart(2, '0')}`,
        end: `${String(apartment.endComplexNumber)}${String(apartment.endBuildingNumber).padStart(2, '0')}`,
      },
      hoRange: {
        start: `${String(apartment.startFloorNumber)}${String(apartment.startUnitNumber).padStart(2, '0')}`,
        end: `${String(apartment.endFloorNumber)}${String(apartment.endUnitNumber).padStart(2, '0')}`,
      },
    };
  }

  // 아파트 상세 조회 (관리자 정보 포함)
  async getApartmentByIdForAdmin(id: string): Promise<ApartmentResponseWithRangeDto | null> {
    const apartment = await apartmentRepository.getApartmentById(id);

    if (!apartment) {
      return null;
    }

    return {
      id: apartment.id,
      name: apartment.name,
      address: apartment.address,
      officeNumber: apartment.officeNumber,
      description: apartment.description,
      startComplexNumber: String(apartment.startComplexNumber).padStart(2, '0'),
      endComplexNumber: String(apartment.endComplexNumber).padStart(2, '0'),
      startDongNumber: String(apartment.startBuildingNumber).padStart(2, '0'),
      endDongNumber: String(apartment.endBuildingNumber).padStart(2, '0'),
      startFloorNumber: String(apartment.startFloorNumber).padStart(2, '0'),
      endFloorNumber: String(apartment.endFloorNumber).padStart(2, '0'),
      startHoNumber: String(apartment.startUnitNumber).padStart(2, '0'),
      endHoNumber: String(apartment.endUnitNumber).padStart(2, '0'),
      apartmentStatus: apartment.apartmentStatus,
      adminId: apartment.users[0].id,
      adminName: apartment.users[0].name,
      adminContact: apartment.users[0].contact,
      adminEmail: apartment.users[0].email,
      dongRange: {
        start: `${String(apartment.startComplexNumber)}${String(apartment.startBuildingNumber).padStart(2, '0')}`,
        end: `${String(apartment.endComplexNumber)}${String(apartment.endBuildingNumber).padStart(2, '0')}`,
      },
      hoRange: {
        start: `${String(apartment.startFloorNumber)}${String(apartment.startUnitNumber).padStart(2, '0')}`,
        end: `${String(apartment.endFloorNumber)}${String(apartment.endUnitNumber).padStart(2, '0')}`,
      },
    };
  }
}

export default new ApartmentService();
