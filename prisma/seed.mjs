import { PrismaClient } from '@prisma/client';
import { fakerKO as faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 여기에 시딩 로직을 작성할 예정입니다.
  console.log('Seeding started...');

  // 시딩할 데이터 생성
  // 아파트
  // 아파트 이름 후보 배열로 생성
  const apartmentNames = [
    '한강뷰 아파트',
    '아이파크 아파트',
    '센트럴 시티 아파트',
    '주공 아파트',
    '현대 아파트',
    '동보 아파트',
    '이편한 아파트',
    '자연 아파트',
    '세이프 아파트',
    '힐스테이트 아파트',
  ];

  // 아파트 내용 후보 배열로 생성
  const apartmentDescriptions = [
    '편리한 교통과 아름다운 전망을 자랑하는 아파트입니다.',
    '최신 시설과 쾌적한 환경을 제공하는 아파트입니다.',
    '가족과 함께 살기 좋은 아파트입니다.',
    '도심 속에서 자연을 느낄 수 있는 아파트입니다.',
    '안전하고 조용한 주거 환경을 제공하는 아파트입니다.',
    '커뮤니티 시설이 잘 갖춰진 아파트입니다.',
    '아이들이 뛰어놀기 좋은 공원이 가까운 아파트입니다.',
    '쇼핑몰과 가까워 생활이 편리한 아파트입니다.',
    '학교와 가까워 교육 환경이 좋은 아파트입니다.',
    '다양한 편의시설이 인접한 아파트입니다.',
  ];

  // Promise.all을 사용하여 병렬로 아파트 생성 처리
  const apartments = await Promise.all(
    Array(5)
      .fill(null)
      .map(() =>
        prisma.apartment.create({
          data: {
            name: faker.helpers.arrayElement(apartmentNames), // 아파트 이름 후보 중에서 랜덤 선택
            address: faker.location.city(),
            officeNumber: faker.phone.number(),
            description: faker.helpers.arrayElement(apartmentDescriptions), // 아파트 설명 후보 중에서 랜덤 선택
            startComplexNumber: 1,
            startBuildingNumber: 1,
            startFloorNumber: 1,
            startUnitNumber: 1,
            endComplexNumber: faker.number.int({ min: 1, max: 10 }),
            endBuildingNumber: faker.number.int({ min: 1, max: 10 }),
            endFloorNumber: faker.number.int({ min: 1, max: 30 }),
            endUnitNumber: faker.number.int({ min: 1, max: 10 }),
            apartmentStatus: 'APPROVED',
          },
        }),
      ),
  );

  //일반 유저 20명 생성

  // 유저네임(id)을 편의성을 위해 후보 배열에서 순서대로 선정
  const userNames = [
    'user1',
    'user2',
    'user3',
    'user4',
    'user5',
    'user6',
    'user7',
    'user8',
    'user9',
    'user10',
    'user11',
    'user12',
    'user13',
    'user14',
    'user15',
    'user16',
    'user17',
    'user18',
    'user19',
    'user20',
  ];

  // Promise.all을 사용하여 병렬로 비밀번호 해싱 처리
  const createdUsers = await Promise.all(
    Array(20)
      .fill(null)
      .map(async (e, index) => {
        const hashedPassword = await bcrypt.hash('1234', 10); // 모든 유저 비밀번호를 '1234'로 통일 (테스트 편의성)
        const apartment = apartments[Math.floor(Math.random() * apartments.length)];
        return prisma.user.create({
          data: {
            username: userNames[index], // 유저네임 후보 배열에서 순서대로 선택
            password: hashedPassword,
            contact: faker.phone.number(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            avatar: faker.image.avatar(),
            role: 'USER',
            joinStatus: 'APPROVED',
            apartmentId: apartment.id, // 랜덤 아파트 연결
          },
        });
      }),
  );

  // 관리자 유저네임 배열
  const adminUserNames = ['admin1', 'admin2', 'admin3', 'admin4', 'admin5'];
  // 관리자 유저 5명 생성
  const createdAdminUsers = await Promise.all(
    Array(5)
      .fill(null)
      .map(async (e, index) => {
        const hashedPassword = await bcrypt.hash('1234', 10); // 모든 유저 비밀번호를 '1234'로 통일 (테스트 편의성)
        const apartment = apartments[index % apartments.length];
        return prisma.user.create({
          data: {
            username: adminUserNames[index], // 관리자 유저네임 후보 배열에서 순서대로 선택
            password: hashedPassword,
            contact: faker.phone.number(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            avatar: faker.image.avatar(),
            role: 'ADMIN',
            joinStatus: 'APPROVED',
            apartmentId: apartment.id, // 순차적으로 아파트 연결
          },
        });
      }),
  );

  // 유저 아파트 정보 (거주자)
  const userAptInfosData = createdUsers.map((user) => {
    const userApartment = apartments.find((apt) => apt.id === user.apartmentId);

    const complex = faker.number.int({
      min: userApartment.startComplexNumber,
      max: userApartment.endComplexNumber,
    });
    const building = faker.number.int({
      min: userApartment.startBuildingNumber,
      max: userApartment.endBuildingNumber,
    });
    const floor = faker.number.int({
      min: userApartment.startFloorNumber,
      max: userApartment.endFloorNumber,
    });
    const unit = faker.number.int({
      min: userApartment.startUnitNumber,
      max: userApartment.endUnitNumber,
    });

    // 참고: 동/호 정보를 문자열로 조합합니다. Prisma 스키마에서 해당 필드가 String 타입이어야 합니다.
    const dong = `${complex}${String(building).padStart(2, '0')}`; // 1동, 2동 -> '01', '02'
    const ho = `${floor}${String(unit).padStart(2, '0')}`; // 1호, 2호 -> '01', '02'

    return {
      userId: user.id,
      apartmentDong: dong,
      apartmentHo: ho,
    };
  });

  // 아파트의 거주자 리스트 생성
  await Promise.all(
    createdUsers.map(async (user, index) => {
      const aptInfo = userAptInfosData[index];

      const residentList = await prisma.residentList.create({
        data: {
          userId: user.id,
          apartmentId: user.apartmentId,
          apartmentDong: aptInfo.apartmentDong,
          apartmentHo: aptInfo.apartmentHo,
          contact: user.contact,
          name: user.name,
          isHouseholder: true, // 모든 유저를 세대주로 설정 (테스트 편의성)
          isRegistered: true,
          approvalStatus: 'APPROVED', // 모든 거주자 승인 상태를 승인으로 설정 (테스트 편의성)
          email: user.email,
        },
      });
    }),
  );

  // 아파트 별 보드 3개 만들기 (Notice, Complaint, Poll)

  const boardNames = ['Notice', 'Complaint', 'Poll'];
  const boardsData = [];

  apartments.forEach((apartment) => {
    const admin = createdAdminUsers.find((u) => u.apartmentId === apartment.id);
    if (admin) {
      boardNames.forEach((name) => {
        boardsData.push({
          apartmentId: apartment.id,
          adminId: admin.id,
          boardType: name.toUpperCase(), // Notice -> NOTICE, Complaint -> COMPLAINT, Poll -> POLL
        });
      });
    }
  });

  await prisma.board.createMany({ data: boardsData });

  // createMany는 생성된 객체(ID 포함)를 반환하지 않으므로, ID를 사용하기 위해 DB에서 다시 조회합니다.
  const createdBoards = await prisma.board.findMany();

  // 공지사항(Notice) 등록
  const noticesData = [];
  // 공지사항 카테고리 후보 배열
  const noticeCategories = [
    'MAINTENANCE',
    'EMERGENCY',
    'COMMUNITY',
    'RESIDENT_VOTE',
    'RESIDENT_COUNCIL',
    'ETC',
  ];
  // 공지사항 내용 배열
  const noticeContents = [
    '테스트입니다.',
    '공지사항 내용입니다.',
    '중요한 공지입니다.',
    '커뮤니티 공지입니다.',
    '테스트 공지입니다.',
    '불편사항 공지입니다.',
  ];
  // 각 아파트마다 3개의 공지사항 생성
  createdAdminUsers.forEach((admin) => {
    const noticeCount = 3;
    for (let i = 0; i < noticeCount; i++) {
      const hasDate = faker.datatype.boolean();
      noticesData.push({
        boardId: createdBoards.find(
          (board) => board.apartmentId === admin.apartmentId && board.boardType === 'NOTICE',
        )?.id,
        adminId: admin.id,
        category: faker.helpers.arrayElement(noticeCategories), // 공지사항 카테고리 후보 배열에서 랜덤 선택
        isPinned: faker.datatype.boolean(), // 공지사항 고정 여부 랜덤 설정
        startDate: hasDate ? faker.date.past() : null,
        endDate: hasDate ? faker.date.future() : null,
        title: `공지사항 ${i + 1}`,
        content: faker.helpers.arrayElement(noticeContents), // 공지사항 내용 배열에서 랜덤 선택
        viewCount: faker.number.int({ min: 0, max: 100 }), // 조회수 랜덤 설정
      });
    }
  });

  await prisma.notice.createMany({ data: noticesData });

  // 민원(complaint) 등록
  const complaintsData = [];
  // 민원 내용 배열
  const complaintContents = [
    '테스트입니다.',
    '민원 내용입니다.',
    '층간 소음이 너무 심해요.',
    '엘리베이터가 고장났습니다.',
    '주차 공간이 부족합니다.',
    '공용 공간이 청결하지 않습니다.',
    '보안이 불안합니다.',
    '관리 사무소의 응대가 불친절합니다.',
    '공사 소음이 너무 시끄럽습니다.',
    '쓰레기 수거가 제대로 이루어지지 않습니다.',
  ];
  // 민원 처리 상태 후보 배열
  const complaintStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

  // 각 아파트마다 5개의 민원 생성
  createdUsers.forEach((user) => {
    const complaintCount = 3;
    for (let i = 0; i < complaintCount; i++) {
      complaintsData.push({
        boardId: createdBoards.find(
          (board) => board.apartmentId === user.apartmentId && board.boardType === 'COMPLAINT',
        )?.id,
        creatorId: user.id,
        adminId: createdAdminUsers.find((admin) => admin.apartmentId === user.apartmentId)?.id,
        title: `민원 ${i + 1}`,
        content: faker.helpers.arrayElement(complaintContents), // 민원 내용 배열에서 랜덤 선택
        isPublic: faker.datatype.boolean(), // 민원 공개 여부 랜덤 설정
        status: faker.helpers.arrayElement(complaintStatuses), // 민원 처리 상태 후보 배열에서 랜덤 선택
        viewCount: faker.number.int({ min: 0, max: 100 }), // 조회수 랜덤 설정
      });
    }
  });

  await prisma.complaint.createMany({ data: complaintsData });

  // 투표(Poll) 등록
  const pollsData = [];
  // 투표 제목 후보 배열
  const pollTitles = [
    '아파트 단지 내 CCTV 설치에 대한 찬반 투표',
    '공용 공간 내 흡연 구역 설치에 대한 찬반 투표',
    '아파트 단지 내 애완동물 허용 여부에 대한 찬반 투표',
    '공용 공간 내 자전거 보관소 설치에 대한 찬반 투표',
    '아파트 단지 내 어린이 놀이터 설치에 대한 찬반 투표',
  ];
  // 투표 설명 후보 배열
  const pollDescriptions = [
    '아파트 단지 내 CCTV 설치에 대한 찬반 투표입니다.',
    '공용 공간 내 흡연 구역 설치에 대한 찬반 투표입니다.',
    '아파트 단지 내 애완동물 허용 여부에 대한 찬반 투표입니다.',
    '공용 공간 내 자전거 보관소 설치에 대한 찬반 투표입니다.',
    '아파트 단지 내 어린이 놀이터 설치에 대한 찬반 투표입니다.',
  ];

  // 각 아파트마다 2개의 투표 생성

  createdAdminUsers.forEach((admin) => {
    const adminApartment = apartments.find((apt) => apt.id === admin.apartmentId); // 동 정보 생성을 위해 아파트 정보 조회
    const pollCount = 2;
    for (let i = 0; i < pollCount; i++) {
      const pollIndex = faker.number.int({ min: 0, max: pollTitles.length - 1 });

      const status = faker.helpers.arrayElement(['UPCOMING', 'ONGOING', 'CLOSED']);
      let startDate, endDate;

      if (status === 'CLOSED') {
        endDate = faker.date.past();
        startDate = faker.date.past({ refDate: endDate }); // 종료일보다 더 과거
      } else if (status === 'ONGOING') {
        startDate = faker.date.past();
        endDate = faker.date.future();
      } else {
        startDate = faker.date.future();
        endDate = faker.date.future({ refDate: startDate }); // 시작일보다 더 미래
      }

      // 투표 허용 범위 설정 (전체 또는 특정 동)
      // 특정 동 필드가 따로 없고 buildingPermission에 string[] 형태로 저장
      const isSpecificBuilding = faker.datatype.boolean();
      const buildingPermission = [];

      if (isSpecificBuilding) {
        const complex = faker.number.int({
          min: adminApartment.startComplexNumber,
          max: adminApartment.endComplexNumber,
        });
        const building = faker.number.int({
          min: adminApartment.startBuildingNumber,
          max: adminApartment.endBuildingNumber,
        });
        const targetDong = `${complex}${String(building).padStart(2, '0')}`;
        buildingPermission.push(targetDong);
      }

      pollsData.push({
        boardId: createdBoards.find(
          (board) => board.apartmentId === admin.apartmentId && board.boardType === 'POLL',
        )?.id,
        adminId: admin.id,
        buildingPermission,
        title: pollTitles[pollIndex],
        description: pollDescriptions[pollIndex],
        startDate,
        endDate,
        status,
      });
    }
  });

  await prisma.poll.createMany({ data: pollsData });

  // 투표의 투표 항목(PollOption) 등록
  const createdPolls = await prisma.poll.findMany({
    include: {
      board: true,
    },
  });
  const pollOptionsData = [];
  const pollsToUpdate = [];

  createdPolls.forEach((poll) => {
    // 각 투표마다 2~4개의 투표 항목 생성
    const optionCount = faker.number.int({ min: 2, max: 4 });
    const currentPollOptions = [];

    for (let i = 0; i < optionCount; i++) {
      const option = {
        pollId: poll.id,
        content: `옵션 ${i + 1} - ${poll.title}`,
        voteCount: faker.number.int({ min: 0, max: 100 }),
      };
      pollOptionsData.push(option);
      currentPollOptions.push(option);
    }
  });

  await prisma.pollOption.createMany({ data: pollOptionsData });
  await Promise.all(pollsToUpdate);

  // 사람들의 투표용지를 뜻하는 vote 생성
  // Poll을 조회할 때 Board 정보를 포함시켜서 apartmentId를 확인할 수 있게 합니다.

  const createdPollOptions = await prisma.pollOption.findMany();

  const votesData = [];

  createdUsers.forEach((user, index) => {
    const userAptInfo = userAptInfosData[index];

    // 1. 유저가 참여 가능한 투표 필터링 (진행중 또는 종료된 투표)
    const availablePolls = createdPolls.filter((poll) => {
      const isSameApartment = poll.board.apartmentId === user.apartmentId;
      const hasPermission =
        poll.buildingPermission.length === 0 ||
        poll.buildingPermission.includes(userAptInfo.apartmentDong);
      const isVotable = ['ONGOING', 'CLOSED'].includes(poll.status);

      return isSameApartment && hasPermission && isVotable;
    });

    if (availablePolls.length === 0) return;

    // 2. 참여 가능한 투표 중에서 1~3개를 무작위로 선택
    const pollsToVoteOn = faker.helpers
      .shuffle(availablePolls)
      .slice(0, faker.number.int({ min: 1, max: Math.min(3, availablePolls.length) }));

    // 3. 선택된 각 투표에 대해 하나의 옵션을 선택하여 투표 데이터 생성
    pollsToVoteOn.forEach((poll) => {
      const optionsForPoll = createdPollOptions.filter((option) => option.pollId === poll.id);
      if (optionsForPoll.length === 0) return;

      const chosenOption = faker.helpers.arrayElement(optionsForPoll);
      votesData.push({
        userId: user.id,
        optionId: chosenOption.id,
        pollId: chosenOption.pollId,
      });
    });
  });

  await prisma.vote.createMany({ data: votesData });

  // 민원에 댓글이 달리는 경우 - complaintComment
  // 댓글 내용 후보 배열
  const commentContents = [
    '민원 댓글입니다.',
    '이 민원에 대한 답변을 확인해주세요.',
    '민원 처리가 지연되고 있습니다.',
    '테스트 댓글입니다.',
    '이 문제는 빠르게 해결되어야 합니다.',
    '처리가 너무 느립니다.',
  ];

  const createdComplaints = await prisma.complaint.findMany({
    include: {
      board: true,
    },
  });

  const complaintCommentsData = [];

  createdComplaints.forEach((complaint) => {
    const apartmentResidents = createdUsers.filter(
      (user) => user.apartmentId === complaint.board.apartmentId,
    );

    if (apartmentResidents.length === 0) return;

    const commentCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < commentCount; i++) {
      complaintCommentsData.push({
        userId: faker.helpers.arrayElement(apartmentResidents).id, // 같은 아파트 주민 중 랜덤 선택
        complaintId: complaint.id,
        content: faker.helpers.arrayElement(commentContents),
        createdAt: faker.date.past(),
      });
    }
  });

  await prisma.complaintComment.createMany({ data: complaintCommentsData });

  // 공지사항에 댓글이 달리는 경우 - noticeComment
  // 댓글 내용 후보 배열
  const noticeCommentContents = [
    '공지사항 댓글입니다.',
    '이 공지사항에 대한 의견을 남겨주세요.',
    '공지사항 내용이 유익합니다.',
    '테스트 공지사항 댓글입니다.',
    '더 많은 정보가 필요합니다.',
    '감사합니다, 좋은 공지입니다.',
  ];

  const createdNotices = await prisma.notice.findMany({
    include: {
      board: true,
    },
  });

  const noticeCommentsData = [];

  createdNotices.forEach((notice) => {
    const apartmentResidents = createdUsers.filter(
      (user) => user.apartmentId === notice.board.apartmentId,
    );

    if (apartmentResidents.length === 0) return;

    const commentCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < commentCount; i++) {
      noticeCommentsData.push({
        userId: faker.helpers.arrayElement(apartmentResidents).id, // 같은 아파트 주민 중 랜덤 선택
        noticeId: notice.id,
        content: faker.helpers.arrayElement(noticeCommentContents),
        createdAt: faker.date.past(),
      });
    }
  });

  await prisma.noticeComment.createMany({ data: noticeCommentsData });

  // 알림 (Notification) 생성
  const notificationsData = [];

  // 1. 공지사항 알림 (해당 아파트 거주자들에게)
  createdNotices.forEach((notice) => {
    const apartmentResidents = createdUsers.filter(
      (user) => user.apartmentId === notice.board.apartmentId,
    );

    apartmentResidents.forEach((resident) => {
      notificationsData.push({
        userId: resident.id,
        notiType: 'NOTICE',
        title: '새로운 공지사항이 등록되었습니다.',
        content: notice.title,
        url: `/boards/${notice.boardId}/notices/${notice.id}`,
        isChecked: faker.datatype.boolean(), // 알림 읽음 여부 랜덤 설정
        createdAt: faker.date.recent(),
      });
    });
  });

  // 2. 민원 알림 (요청/해결) (해당 아파트 거주자들에게)
  createdComplaints.forEach((complaint) => {
    const apartmentResidents = createdUsers.filter(
      (user) => user.apartmentId === complaint.board.apartmentId,
    );

    apartmentResidents.forEach((resident) => {
      // 민원 요청 알림
      notificationsData.push({
        userId: resident.id,
        notiType: 'COMPLAINT_RAISED',
        title: '새로운 민원이 등록되었습니다.',
        content: complaint.title,
        url: `/boards/${complaint.boardId}/complaints/${complaint.id}`,
        isChecked: faker.datatype.boolean(),
        createdAt: faker.date.past(),
      });

      // 민원 해결 알림 (완료/거절 시)
      if (['COMPLETED', 'REJECTED'].includes(complaint.status)) {
        notificationsData.push({
          userId: resident.id,
          notiType: 'COMPLAINT_RESOLVED',
          title: '민원 처리 상태가 변경되었습니다.',
          content: `민원 "${complaint.title}"의 상태가 ${complaint.status}로 변경되었습니다.`,
          url: `/boards/${complaint.boardId}/complaints/${complaint.id}`,
          isChecked: faker.datatype.boolean(),
          createdAt: faker.date.recent(),
        });
      }
    });
  });

  // 3. 투표 알림 (시작/종료) (해당 아파트 거주자들에게)
  createdPolls.forEach((poll) => {
    const apartmentResidents = createdUsers.filter(
      (user) => user.apartmentId === poll.board.apartmentId,
    );

    apartmentResidents.forEach((resident) => {
      // 투표 시작 알림
      notificationsData.push({
        userId: resident.id,
        notiType: 'POLL_START',
        title: '새로운 투표가 시작되었습니다.',
        content: poll.title,
        url: `/boards/${poll.boardId}/polls/${poll.id}`,
        isChecked: faker.datatype.boolean(),
        createdAt: poll.startDate || faker.date.past(),
      });

      // 투표 종료 알림
      if (poll.status === 'CLOSED') {
        notificationsData.push({
          userId: resident.id,
          notiType: 'POLL_END',
          title: '투표가 종료되었습니다.',
          content: `투표 "${poll.title}"가 종료되었습니다.`,
          url: `/boards/${poll.boardId}/polls/${poll.id}`,
          isChecked: faker.datatype.boolean(),
          createdAt: poll.endDate || faker.date.recent(),
        });
      }
    });
  });

  // 스키마 반영 이후 활성화 예정
  // 4. 회원가입 요청 알림 (해당 아파트 관리자에게)
  createdUsers.forEach((user) => {
    const admin = createdAdminUsers.find((admin) => admin.apartmentId === user.apartmentId);
    if (admin) {
      notificationsData.push({
        userId: admin.id,
        notiType: 'SIGNUP_REQ',
        title: '회원 가입 요청이 있습니다.',
        content: `${user.name}님이 입주민 가입을 요청했습니다.`,
        url: `/admin/users/${user.id}`,
        isChecked: faker.datatype.boolean(),
        createdAt: faker.date.past(),
      });
    }
  });

  await prisma.notification.createMany({ data: notificationsData });

  // 날짜가 있는 공지사항과 투표는 이벤트에 추가
  const eventsData = [];
  createdNotices.forEach((notice) => {
    if (notice.startDate && notice.endDate) {
      eventsData.push({
        adminId: notice.adminId,
        noticeId: notice.id,
        pollId: null,
        title: notice.title,
      });
    }
  });

  createdPolls.forEach((poll) => {
    if (poll.startDate && poll.endDate) {
      eventsData.push({
        adminId: poll.adminId,
        noticeId: null,
        pollId: poll.id,
        title: poll.title,
      });
    }
  });

  await prisma.event.createMany({ data: eventsData });

  // 시딩이 완료되면 콘솔에 메시지 출력
  console.log('Seeding finished.');

  // 생성된 데이터 요약 출력
  const summary = {
    Apartments: await prisma.apartment.count(),
    Users: await prisma.user.count(),
    ResidentLists: await prisma.residentList.count(),
    Boards: await prisma.board.count(),
    Notices: await prisma.notice.count(),
    Complaints: await prisma.complaint.count(),
    Polls: await prisma.poll.count(),
    PollOptions: await prisma.pollOption.count(),
    Votes: await prisma.vote.count(),
    ComplaintComments: await prisma.complaintComment.count(),
    NoticeComments: await prisma.noticeComment.count(),
    Notifications: await prisma.notification.count(),
    Events: await prisma.event.count(),
  };
  console.table(summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
