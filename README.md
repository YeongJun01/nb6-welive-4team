# WeLive API Server (Apartment Community Platform)

## 개요

아파트 단지 관리 및 입주민 간 소통을 위한 **WeLive** 백엔드 API 서버입니다.
Node.js, Express v5, TypeScript를 기반으로 구축되었으며, Prisma ORM을 통해 PostgreSQL과 상호작용합니다.
**Feature-based Modular Architecture**를 채택하여 기능별로 독립적인 모듈을 구성하고, 각 모듈의 라우터에서 수동 생성자 주입(Manual DI)으로 계층 간 의존성을 조립합니다.

### 주요 기술

- **Backend:** Node.js, Express.js v5
- **언어:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **인증:** JWT (jsonwebtoken), bcrypt, HttpOnly Cookie 기반 Refresh Token
- **Validation:** Superstruct (런타임 구조 검증)
- **파일 업로드:** Multer (CSV 업로드), AWS S3 (multer-s3)
- **실시간 통신:** Socket.io + SSE (Server-Sent Events)
- **스케줄링:** node-cron (투표 상태 자동 변경)
- **API 문서화:** Swagger (swagger-jsdoc, swagger-ui-express)
- **Infrastructure:** AWS (EC2, S3, RDS), Nginx, PM2

---

## 아키텍처 (Feature-based Modular + Manual DI)

기능 단위로 모듈을 분리하고, 각 모듈의 **라우터 파일에서 수동으로 의존성을 조립**하는 구조입니다.

```
Router (라우트 정의, 수동 DI 조립)
  → Controller (HTTP 요청/응답, Superstruct 검증)
    → Service (비즈니스 로직)
      → Repository (Prisma 데이터베이스 접근)
```

### 계층별 역할

- **Router (`*.router.ts`)**: Repository → Service → Controller 인스턴스를 생성자 주입으로 조립하고, Express 라우트에 바인딩합니다.
- **Controller (`*.controller.ts`)**: HTTP 요청 데이터를 Superstruct로 검증하고, Service에 위임한 뒤 응답을 반환합니다.
- **Service (`*.service.ts`)**: 핵심 비즈니스 로직을 처리하며, 커스텀 에러를 throw합니다.
- **Repository (`*.repository.ts`)**: Prisma Client를 통해 데이터베이스 CRUD만 담당합니다.

### 진입점

- `src/main.ts` — HTTP 서버 생성, Socket.io 초기화, 크론잡 설정
- `src/app.ts` — Express 앱 설정, 글로벌 미들웨어 등록, 모듈 라우터 마운트

### 인증 흐름

- **Access Token** (1시간): `Authorization: Bearer <token>` 헤더로 전달
- **Refresh Token** (7일): HttpOnly 쿠키로 관리
- `authMiddleware`가 JWT에서 `userId`를 추출하여 `req.user.id`에 할당
- 가입 상태 흐름: `PENDING` → `APPROVED` / `REJECTED` / `NEED_UPDATE`

### 실시간 알림

Socket.io 푸시 이벤트 + SSE 엔드포인트(`/notifications/sse`, 30초 폴링) 이중 구조.
알림 타입: 공지사항, 민원 상태 변경, 투표 생성/시작/종료, 회원가입 요청 등.

---

## 주요 기능

- **인증**: 로그인, 로그아웃, JWT Access/Refresh Token 관리
- **회원가입**: 입주민/관리자/슈퍼관리자 회원가입 (입주민 명부 기반 검증)
- **사용자 관리**: 프로필 수정, 비밀번호 변경
- **관리자 관리**: 관리자 승인/거절, 정보 수정, 삭제
- **입주민 관리**: 입주민 승인/거절, 거절된 사용자 일괄 삭제
- **아파트 정보**: 단지 정보 조회 (공개/인증 구분)
- **입주민 명부 (ResidentList)**: CRUD, CSV 업로드/다운로드, 템플릿 다운로드
- **민원 (Complaint)**: 접수, 조회, 수정, 삭제, 상태 변경 (PENDING → IN_PROGRESS → RESOLVED/REJECTED)
- **투표 (Poll)**: 생성, 목록/상세 조회, 수정, 삭제, 상태 자동 변경 (cron)
- **투표 참여 (Vote)**: 옵션 선택, 투표 취소
- **공지사항 (Notice)**: 등록, 조회, 수정, 삭제
- **댓글 (Comment)**: 민원/공지에 대한 댓글 작성, 수정, 삭제
- **이벤트 (Event)**: 일정 목록 조회 (Poll/Notice 생성 시 자동 생성)
- **실시간 알림 (Notification)**: Socket.io + SSE 기반 실시간 알림, 읽음 처리

---

## API Endpoints

- 기본 URL: `http://localhost:3000`

### 🔐 인증 (Auth) — `/auth`

| Method   | Endpoint                        | 인증 | 설명                       |
| :------- | :------------------------------ | :--: | :------------------------- |
| `POST`   | `/login`                        |  X   | 로그인                     |
| `POST`   | `/refresh`                      |  X   | Access Token 갱신          |
| `POST`   | `/logout`                       |  X   | 로그아웃                   |
| `POST`   | `/signup`                       |  X   | 입주민 회원가입            |
| `POST`   | `/signup/admin`                 |  X   | 관리자 회원가입            |
| `POST`   | `/signup/super-admin`           |  X   | 슈퍼관리자 회원가입        |
| `PATCH`  | `/admins/status`                |  O   | 관리자 승인 상태 일괄 변경 |
| `PATCH`  | `/admins/:adminId/status`       |  O   | 관리자 승인 상태 변경      |
| `PATCH`  | `/admins/:adminId`              |  O   | 관리자 정보 수정           |
| `DELETE` | `/admins/:adminId`              |  O   | 관리자 삭제                |
| `PATCH`  | `/residents/status`             |  O   | 입주민 승인 상태 일괄 변경 |
| `PATCH`  | `/residents/:residentId/status` |  O   | 입주민 승인 상태 변경      |
| `POST`   | `/cleanup`                      |  O   | 거절된 사용자 삭제         |

### 👤 사용자 (Users) — `/users`

| Method  | Endpoint    | 인증 | 설명             |
| :------ | :---------- | :--: | :--------------- |
| `PATCH` | `/me`       |  O   | 프로필 정보 수정 |
| `PATCH` | `/password` |  O   | 비밀번호 변경    |

### 🏢 아파트 (Apartments) — `/apartments`

| Method | Endpoint      | 인증 | 설명                    |
| :----- | :------------ | :--: | :---------------------- |
| `GET`  | `/public`     |  X   | 아파트 목록 조회 (공개) |
| `GET`  | `/public/:id` |  X   | 아파트 상세 조회 (공개) |
| `GET`  | `/`           |  O   | 아파트 목록 조회        |
| `GET`  | `/:id`        |  O   | 아파트 상세 조회        |

### 📋 입주민 명부 (ResidentList) — `/residents`

| Method   | Endpoint         | 인증 | 설명                        |
| :------- | :--------------- | :--: | :-------------------------- |
| `GET`    | `/`              |  O   | 입주민 명부 목록 조회       |
| `POST`   | `/`              |  O   | 입주민 등록                 |
| `POST`   | `/from-file`     |  O   | CSV 파일로 입주민 일괄 등록 |
| `GET`    | `/file/template` |  O   | CSV 템플릿 다운로드         |
| `GET`    | `/file`          |  O   | 입주민 명부 CSV 다운로드    |
| `GET`    | `/:id`           |  O   | 입주민 상세 조회            |
| `PATCH`  | `/:id`           |  O   | 입주민 정보 수정            |
| `DELETE` | `/:id`           |  O   | 입주민 삭제                 |
| `PUT`    | `/:id`           |  O   | 입주민 소프트 삭제          |

### 📋 민원 (Complaints) — `/complaints`

| Method   | Endpoint               | 인증 | 설명           |
| :------- | :--------------------- | :--: | :------------- |
| `POST`   | `/`                    |  O   | 민원 접수      |
| `GET`    | `/`                    |  O   | 민원 목록 조회 |
| `GET`    | `/:complaintId`        |  O   | 민원 상세 조회 |
| `PATCH`  | `/:complaintId`        |  O   | 민원 내용 수정 |
| `PATCH`  | `/:complaintId/status` |  O   | 민원 상태 변경 |
| `DELETE` | `/:complaintId`        |  O   | 민원 삭제      |

### 🗳️ 투표 게시판 (Polls) — `/polls`

| Method   | Endpoint   | 인증 | 설명           |
| :------- | :--------- | :--: | :------------- |
| `POST`   | `/`        |  O   | 투표 생성      |
| `GET`    | `/`        |  O   | 투표 목록 조회 |
| `GET`    | `/:pollId` |  O   | 투표 상세 조회 |
| `PATCH`  | `/:pollId` |  O   | 투표 수정      |
| `DELETE` | `/:pollId` |  O   | 투표 삭제      |

### ✅ 투표 참여 (Votes) — `/options`

| Method   | Endpoint          | 인증 | 설명           |
| :------- | :---------------- | :--: | :------------- |
| `POST`   | `/:optionId/vote` |  O   | 투표 옵션 선택 |
| `DELETE` | `/:optionId/vote` |  O   | 투표 취소      |

### 📢 공지사항 (Notices) — `/notices`

| Method   | Endpoint     | 인증 | 설명               |
| :------- | :----------- | :--: | :----------------- |
| `POST`   | `/`          |  O   | 공지사항 등록      |
| `GET`    | `/`          |  O   | 공지사항 목록 조회 |
| `GET`    | `/:noticeId` |  O   | 공지사항 상세 조회 |
| `PATCH`  | `/:noticeId` |  O   | 공지사항 수정      |
| `DELETE` | `/:noticeId` |  O   | 공지사항 삭제      |

### 💬 댓글 (Comments) — `/comments`

| Method   | Endpoint | 인증 | 설명      |
| :------- | :------- | :--: | :-------- |
| `POST`   | `/`      |  O   | 댓글 작성 |
| `PATCH`  | `/:id`   |  O   | 댓글 수정 |
| `DELETE` | `/:id`   |  O   | 댓글 삭제 |

### 🔔 알림 (Notifications) — `/notifications`

| Method  | Endpoint                | 인증 | 설명                                   |
| :------ | :---------------------- | :--: | :------------------------------------- |
| `GET`   | `/sse`                  |  O   | 읽지 않은 알림 실시간 수신 (SSE, 30초) |
| `PATCH` | `/:notificationId/read` |  O   | 알림 읽음 처리                         |

### 📅 이벤트 (Events) — `/events`

| Method | Endpoint | 인증 | 설명             |
| :----- | :------- | :--: | :--------------- |
| `GET`  | `/`      |  O   | 이벤트 목록 조회 |

---

## 프로젝트 폴더 구조

```
.
├── prisma/
│   ├── migrations/            # 데이터베이스 마이그레이션
│   ├── schema.prisma          # 데이터 모델 정의
│   └── seed.mjs               # 초기 데이터 시드 (@faker-js/faker)
├── src/
│   ├── main.ts                # 서버 실행 진입점 (Socket.io, cron 초기화)
│   ├── app.ts                 # Express 앱 설정 (미들웨어, 라우터 등록)
│   ├── modules/               # 기능별 독립 모듈
│   │   ├── apartment/         # 아파트 정보 관리
│   │   ├── auth/              # 인증 + 회원가입 + 관리자/입주민 관리
│   │   ├── comment/           # 댓글 관리
│   │   ├── complaint/         # 민원 관리
│   │   ├── event/             # 이벤트 관리
│   │   ├── notice/            # 공지사항 관리
│   │   ├── notification/      # 알림 (Socket.io + SSE)
│   │   ├── poll/              # 투표 게시판
│   │   ├── residentList/      # 입주민 명부 (CSV 업로드/다운로드)
│   │   ├── user/              # 사용자 프로필 관리
│   │   └── vote/              # 투표 참여
│   ├── lib/
│   │   ├── prisma.ts          # Prisma Client 싱글톤
│   │   ├── constants.ts       # 환경변수 및 전역 상수
│   │   ├── socket.ts          # Socket.io 싱글톤 (initSocket, getIO)
│   │   └── errors/            # 커스텀 HTTP 에러 클래스
│   ├── middlewares/
│   │   ├── asyncHandler.ts    # 비동기 에러 래퍼
│   │   ├── authMiddleware.ts  # JWT 인증 미들웨어
│   │   ├── errorHandler.ts    # 중앙 에러 핸들러 & 404 처리
│   │   └── upload.ts          # Multer 파일 업로드 설정
│   ├── structs/
│   │   └── common.validation.ts  # Superstruct 공통 검증기
│   └── types/
│       └── express.d.ts       # Express Request 타입 확장 (req.user)
├── jest.config.ts
├── tsconfig.json
├── .prettierrc
└── package.json
```

---

## 실행

### 전제 조건

- Node.js 설치
- PostgreSQL 데이터베이스 실행 중
- 프로젝트 루트에 `.env` 파일 생성

**.env 파일 예시**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3000
JWT_ACCESS_SECRET="your_access_secret_key"
JWT_REFRESH_SECRET="your_refresh_secret_key"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV=development

AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="ap-northeast-2"
AWS_BUCKET_NAME="your_bucket_name"
```

### 설치 및 데이터베이스 초기화

```bash
# 의존성 설치
npm install

# Prisma Client 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 초기 데이터 시드 (선택)
npx prisma db seed
```

### 개발 모드 실행

`nodemon` + `ts-node`를 사용하여 파일 변경 시 서버가 자동으로 재시작됩니다.

```bash
npm run dev
```

### 프로덕션 빌드 및 실행

```bash
npm run build    # TypeScript → JavaScript 컴파일 (dist/)
npm run start    # node dist/main.js 실행
```

---

## 테스트

Jest + ts-jest + Supertest 기반 유닛/통합 테스트를 지원합니다.

```bash
# 전체 테스트 실행
npm run test

# 특정 파일만 실행
npx jest src/modules/auth/__tests__/auth.service.test.ts

# 패턴으로 실행
npx jest --testPathPatterns="notification"
```

| 모듈         | 유닛 테스트   | 통합 테스트 (Supertest) |
| :----------- | :------------ | :---------------------- |
| auth         | Service (7건) | Controller API (5건)    |
| user         | Service (9건) | —                       |
| notification | Service (3건) | Controller API (2건)    |

---

## 인프라 및 배포

- **AWS EC2**: Linux 가상 서버에서 Node.js 앱 호스팅
- **PM2**: 프로세스 매니저를 사용한 무중단 배포 및 상태 관리
- **Nginx**: 리버스 프록시 (80번 포트 → Node.js 내부 포트)
- **AWS S3**: 파일 저장소 (이미지, 문서 등)
- **AWS RDS**: 관리형 PostgreSQL 데이터베이스

---

## 커밋 컨벤션

```
<이모지> <타입> : <제목> (50자 이내, 마침표 X)

✨ feat     : 새로운 기능 추가
🐛 fix      : 버그 수정
📝 docs     : 문서 수정
🛠️ refactor : 리팩토링
✅ test     : 테스트 추가/수정
🔥 remove   : 코드/파일 삭제
♻️ chore    : 유지보수 (빌드/설정/패키지 등)
```
