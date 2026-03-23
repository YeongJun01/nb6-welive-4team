# Welive API Server (Apartment Community Platform)

## 개요

- 이 프로젝트는 아파트 단지 관리 및 입주민 간 소통을 위한 **'Welive'** 애플리케이션의 백엔드 API 서버입니다.
- Node.js, Express, TypeScript를 기반으로 구축되었습니다.
- IoC(Inversion of Control) 원칙을 적용하기 위해 **InversifyJS** 프레임워크를 도입하여 계층 간 결합도를 낮추고, 코드의 유연성과 테스트/유지보수 용이성을 높였습니다.
- Prisma ORM을 통해 PostgreSQL 데이터베이스와 상호작용하며, **Feature-based Modular Architecture**를 채택하여 기능별로 독립적인 모듈을 구성합니다.

### 주요 기술

- **Backend:** Node.js, Express.js v5
- **언어:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **DI (Dependency Injection):** InversifyJS, reflect-metadata
- **인증:** JWT (jsonwebtoken), bcrypt, Cookie 기반 토큰 관리
- **Validation:** superstruct, class-validator, class-transformer, express-validator
- **파일 업로드:** Multer, AWS S3 (multer-s3)
- **실시간 통신:** Socket.io
- **API 문서화:** Swagger (swagger-jsdoc, swagger-ui-express)
- **Infrastructure:** AWS (EC2, S3, RDS), Nginx, PM2

### 주요 라이브러리

`package.json`을 기준으로 한 주요 의존성 라이브러리는 다음과 같습니다.

- **`@prisma/client`**: Prisma 클라이언트 (데이터베이스 쿼리용)
- **`express`**: 웹 프레임워크
- **`typescript`**: 타입스크립트 언어 지원
- **`inversify`**: 의존성 주입(DI) 컨테이너
- **`reflect-metadata`**: 데코레이터 메타데이터를 분석하기 위한 라이브러리 (InversifyJS 필수 의존성)
- **`jsonwebtoken`**: JWT 기반 인증 토큰 생성 및 검증
- **`bcrypt`**: 비밀번호 해싱
- **`superstruct`**: 런타임 데이터 구조 유효성 검사
- **`class-validator`**, **`class-transformer`**: DTO 클래스 기반 데이터 유효성 검사 및 변환
- **`multer`**, **`multer-s3`**: 파일 업로드 처리 (로컬 및 S3 지원)
- **`socket.io`**: 실시간 양방향 통신 (알림 기능)
- **`cookie-parser`**: Cookie 기반 토큰 파싱

---

## 아키텍처 (Feature-based Modular + DI)

본 프로젝트는 기능 단위로 모듈을 분리하는 **Feature-based Modular Architecture**와 **DI 컨테이너**를 결합하여, 계층별 역할을 명확히 분리한 구조를 따릅니다.

1. **모듈 구조 (`src/modules/`)**
   - 각 기능(auth, user, complaint, poll 등)은 독립적인 폴더 아래에 `controller`, `service`, `repository`, `router`를 함께 배치합니다.
   - 모듈 간 결합도를 최소화하여 기능 추가/수정/삭제가 다른 모듈에 영향을 주지 않도록 설계합니다.

2. **의존성 주입 (`InversifyJS`)**
   - 주입 가능한 모든 클래스(`Service`, `Repository`, `Controller`)는 `@injectable()` 데코레이터를 가져야 합니다.
   - 의존성은 생성자 주입을 원칙으로 합니다.
   - 일부 모듈은 라우터 내에서 직접 인스턴스를 생성하는 방식도 병행합니다.

3. **라우터 계층 (`*.router.ts`)**
   - 각 모듈의 라우터 파일은 컨트롤러 인스턴스를 생성(또는 DI 컨테이너에서 주입)받아 Express 경로에 바인딩합니다.
   - `asyncHandler` 미들웨어로 감싸 비동기 에러를 중앙 에러 핸들러로 전달합니다.

4. **애플리케이션 진입점 (`src/app.ts` / `src/main.ts`)**
   - `app.ts`: CORS, JSON 파서, Cookie 파서 등 글로벌 미들웨어를 설정하고, 각 모듈 라우터를 API 경로에 등록합니다.
   - `main.ts`: 서버를 실제로 실행하는 진입점입니다.

5. **계층별 역할**
   - **`Controllers`**: HTTP 요청/응답 처리. 요청 데이터를 검증하고 `Service`에 위임한 뒤 결과를 응답합니다.
   - **`Services`**: 핵심 비즈니스 로직. 여러 `Repository`를 조합하여 복잡한 작업을 처리합니다.
   - **`Repositories`**: 데이터베이스 접근(CRUD)만 담당. Prisma Client를 통해 특정 데이터 모델을 조작합니다.

---

## 주요 기능

- **입주민 인증**: 로그인, 로그아웃, JWT 기반 Access/Refresh Token 관리
- **사용자 관리**: 회원가입(입주민 명부 기반 유효성 검사), 프로필 수정, 비밀번호 변경, 가입 승인 상태 관리, 거절된 사용자 삭제
- **아파트 정보 관리**: 단지 정보(이름, 주소, 연락처), 동/호수 범위 설정
- **입주민 명부(ResidentList)**: 사전 등록된 입주민 정보 기반 회원가입 유효성 검사
- **민원(Complaint) 관리**: 민원 접수, 조회, 수정, 삭제, 상태 변경(대기/처리 중/완료)
- **투표(Poll) 관리**: 투표 생성, 목록/상세 조회, 수정, 삭제
- **투표 참여(Vote)**: 투표 옵션에 투표, 투표 취소
- **실시간 알림(Notification)**: Socket.io 기반 실시간 이벤트 전달
- **이벤트/공지사항/댓글**: 개발 진행 중 (`src.ts` 플레이스홀더)

---

## API Endpoints

- API 기본 경로: `http://localhost:3000`

#### 🔐 인증 (Auth) - `/api/auth`

| Method | Endpoint    | 인증 | 설명                            |
| :----- | :---------- | :--: | :------------------------------ |
| `POST` | `/login`    |  X   | 이메일/비밀번호로 로그인        |
| `POST` | `/refresh`  |  X   | Access Token 갱신               |
| `POST` | `/logout`   |  O   | 로그아웃 (토큰 비활성화)        |

#### 👤 사용자 (Users) - `/api/users`

| Method   | Endpoint        | 인증 | 설명                                |
| :------- | :-------------- | :--: | :---------------------------------- |
| `POST`   | `/signup`       |  O   | 입주민 명부 기반 회원가입           |
| `PATCH`  | `/profile`      |  O   | 프로필 정보 수정                    |
| `PATCH`  | `/password`     |  O   | 비밀번호 변경                       |
| `PATCH`  | `/join-status`  |  O   | 가입 승인 상태 변경 (관리자)        |
| `DELETE` | `/rejected`     |  O   | 거절된 사용자 삭제 (관리자)         |

#### 📋 민원 (Complaints) - `/complaints`

| Method   | Endpoint                       | 인증 | 설명                          |
| :------- | :----------------------------- | :--: | :---------------------------- |
| `POST`   | `/`                            |  O   | 민원 접수                     |
| `GET`    | `/`                            |  X   | 민원 목록 조회                |
| `GET`    | `/:complaintId`                |  X   | 민원 상세 조회                |
| `PATCH`  | `/:complaintId`                |  O   | 민원 내용 수정                |
| `PATCH`  | `/:complaintId/status`         |  O   | 민원 처리 상태 변경           |
| `DELETE` | `/:complaintId`                |  O   | 민원 삭제                     |

#### 🗳️ 투표 게시판 (Polls) - `/polls`

| Method   | Endpoint      | 인증 | 설명                |
| :------- | :------------ | :--: | :------------------ |
| `POST`   | `/`           |  O   | 투표 생성           |
| `GET`    | `/`           |  X   | 투표 목록 조회      |
| `GET`    | `/:pollId`    |  X   | 투표 상세 조회      |
| `PATCH`  | `/:pollId`    |  O   | 투표 수정           |
| `DELETE` | `/:pollId`    |  O   | 투표 삭제           |

#### ✅ 투표 참여 (Votes) - `/options`

| Method   | Endpoint              | 인증 | 설명              |
| :------- | :-------------------- | :--: | :---------------- |
| `POST`   | `/:optionId/vote`     |  O   | 투표 옵션 선택    |
| `DELETE` | `/:optionId/vote`     |  O   | 투표 취소         |

---

## 프로젝트 폴더 구조

```
.
├── prisma/
│   ├── migrations/          # 데이터베이스 마이그레이션 파일
│   ├── schema.prisma        # 데이터 모델 정의
│   └── seed.mjs             # 초기 데이터 시드
├── src/
│   ├── app.ts               # Express 앱 설정 (미들웨어, 라우터 등록)
│   ├── main.ts              # 서버 실행 진입점
│   ├── modules/             # 기능별 독립 모듈 (Feature-based)
│   │   ├── apartment/       # 아파트 정보 관리
│   │   ├── auth/            # 인증 (login, logout, refresh)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.dto.ts
│   │   │   └── auth.router.ts
│   │   ├── comment/         # 댓글 관리 (개발 중)
│   │   ├── complaint/       # 민원 관리
│   │   │   ├── complaint.controller.ts
│   │   │   ├── complaint.service.ts
│   │   │   ├── complaint.repository.ts
│   │   │   ├── complaint.router.ts
│   │   │   ├── complaint.validation.ts
│   │   │   └── complaint.type.ts
│   │   ├── event/           # 이벤트 관리 (개발 중)
│   │   ├── notice/          # 공지사항 관리 (개발 중)
│   │   ├── notification/    # 알림 관리 (개발 중)
│   │   ├── poll/            # 투표 게시판
│   │   │   ├── poll.controller.ts
│   │   │   ├── poll.service.ts
│   │   │   ├── poll.repository.ts
│   │   │   ├── poll.router.ts
│   │   │   └── poll.validation.ts
│   │   ├── residentList/    # 입주민 명부
│   │   │   └── residentList.repository.ts
│   │   ├── user/            # 사용자 관리
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.dto.ts
│   │   │   └── user.router.ts
│   │   └── vote/            # 투표 참여
│   │       ├── vote.controller.ts
│   │       ├── vote.service.ts
│   │       ├── vote.repository.ts
│   │       └── vote.router.ts
│   ├── lib/
│   │   ├── prisma.ts        # Prisma Client 싱글톤 인스턴스
│   │   ├── constants.ts     # 전역 상수 정의
│   │   └── errors/          # 커스텀 HTTP 에러 클래스
│   │       ├── BadRequestError.ts
│   │       ├── ConflictError.ts
│   │       ├── ForbiddenError.ts
│   │       ├── NotFoundError.ts
│   │       ├── UnauthorizedError.ts
│   │       └── ValidationError.ts
│   ├── middlewares/
│   │   ├── asyncHandler.ts  # 비동기 에러 래퍼
│   │   ├── authMiddleware.ts # JWT 인증 미들웨어
│   │   └── errorHandler.ts  # 중앙 에러 핸들러 & 404 처리
│   ├── structs/
│   │   └── common.validation.ts  # superstruct 공통 유효성 검사
│   └── types/
│       └── express.d.ts     # Express Request 타입 확장 (.d.ts)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 개발 컨벤션

- **모듈화 (Feature-based)**: 각 기능은 `src/modules/` 하위에 `controller`, `service`, `repository`, `router`를 함께 배치합니다.
- **의존성 주입 (DI)**:
  - 주입 가능한 클래스는 `@injectable()` 데코레이터를 사용합니다.
  - 의존성은 생성자 주입을 원칙으로 합니다.
  - 바인딩 정보는 `inversify.config.ts`에서 중앙 관리합니다.
- **비동기 처리**: 컨트롤러의 비동기 로직은 `asyncHandler`로 감싸 중앙 `errorHandler`에서 일괄 처리합니다.
- **에러 처리**: `src/lib/errors/`의 커스텀 에러 클래스를 사용하여 HTTP 상태 코드와 에러 메시지를 명확히 구분합니다.
- **유효성 검사**:
  - DTO 기반 검사: `class-validator`, `class-transformer`
  - 런타임 구조 검사: `superstruct` (`src/structs/`)
  - 요청 검사: `express-validator`
- **라우팅**: 각 모듈 라우터에서 컨트롤러 메서드를 명시적으로 바인딩합니다. (`controller.method.bind(controller)`)
- **인증**: `authMiddleware`를 라우터 레벨에서 적용하여 보호가 필요한 엔드포인트를 일괄 처리합니다.

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
JWT_SECRET_KEY="your_jwt_secret_key"

AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="your_aws_region"
AWS_BUCKET_NAME="your_bucket_name"
```

### 데이터베이스 초기화

처음 프로젝트를 설정할 때 아래 명령어로 스키마를 적용하고 초기 데이터를 삽입합니다.

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 마이그레이션
npx prisma migrate dev

# 초기 데이터 시드 (필요 시)
npx prisma db seed
```

### 애플리케이션 실행

개발 모드에서는 `nodemon`과 `ts-node`를 사용하여 파일 변경 시 서버가 자동으로 재시작됩니다.

```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm run dev
```

프로덕션 환경에서는 TypeScript를 JavaScript로 컴파일 후 실행합니다.

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start
```

서버가 성공적으로 실행되면 콘솔에 서버 포트 안내 메시지가 출력됩니다.

---

## 인프라 및 배포 (Infrastructure)

이 프로젝트는 **AWS 클라우드 환경**에서 운영되도록 구성되었습니다.

- **AWS EC2**: Linux 기반 가상 서버에서 Node.js 애플리케이션을 호스팅합니다.
- **PM2**: 프로세스 매니저를 사용하여 무중단 배포 및 상태를 관리합니다.
- **Nginx**: 리버스 프록시 서버로 80번 포트 요청을 Node.js 내부 포트로 전달합니다.
- **AWS S3**: 이미지 파일(프로필, 민원 사진 등)을 안전하고 확장성 있게 저장합니다.
- **AWS RDS**: 관리형 PostgreSQL 서비스로 데이터 안정성과 가용성을 보장합니다.
