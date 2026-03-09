# Welive API Server (Apartment Management System)

## 개요
- 이 프로젝트는 아파트 단지 관리 및 입주민 간의 소통을 위한 'Welive' 애플리케이션의 백엔드 API 서버입니다.
- Node.js, Express, TypeScript를 기반으로 구축되었으며, Prisma ORM을 사용합니다.
- 계층형 아키텍처(Layered Architecture)와 의존성 주입(Dependency Injection)을 적용하여 확장성과 유지보수성을 높였습니다.

### 주요 기술
- **Backend:** Node.js, Express.js
- **언어:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **DI (Dependency Injection):** InversifyJS, reflect-metadata
- **인증:** JWT (jsonwebtoken), bcrypt
- **데이터 유효성 검사:** class-validator, class-transformer
- **실시간 알림:** Socket.io
- **파일 업로드:** Multer, AWS S3
- **API 문서화:** Swagger (swagger-jsdoc, swagger-ui-express)

### 주요 기능
- **입주민 및 관리자 관리**: 회원가입, 로그인, 가입 승인 대기, 프로필 관리.
- **아파트 정보 관리**: 아파트 단지 정보(이름, 주소, 연락처), 동/호수 범위 설정.
- **입주민 명부(ResidentList) 관리**: 사전 등록된 입주민 정보를 바탕으로 한 회원가입 유효성 검사.
- **민원(Complaint) 관리**: 민원 접수, 상태 추적(대기, 처리 중, 완료), 공개/비공개 설정.
- **투표(Poll) 관리**: 입주민 대상 투표 생성, 투표 기간 관리, 실시간 투표 결과 반영.
- **공지사항(Notice) 관리**: 아파트 주요 공지, 고정 게시글(Pinned), 예약 게시글 기능.
- **실시간 알림(Notification)**: 새로운 공지, 민원 상태 변경, 투표 시작/종료 알림.
- **게시판(Board)**: 공지, 투표, 민원 게시판의 통합 관리.

---

## 프로젝트 폴더 구조
```
.
├── prisma/                  # Prisma 설정 및 데이터베이스 스키마
│   ├── schema.prisma        # 데이터 모델 정의
│   └── seed.mjs             # 초기 데이터 시드
├── src/
│   ├── app.ts               # Express 앱 설정
│   ├── main.ts              # 서버 실행 진입점
│   ├── modules/             # 기능별 모듈 (Feature-based Modular)
│   │   ├── apartment/       # 아파트 정보 관리
│   │   ├── auth/            # 인증 및 인가
│   │   ├── comment/         # 댓글 관리
│   │   ├── complaint/       # 민원 관리
│   │   ├── event/           # 이벤트 관리
│   │   ├── notice/          # 공지사항 관리
│   │   ├── notification/    # 알림 관리
│   │   ├── poll/            # 투표 관리
│   │   ├── residentList/    # 입주민 명부 관리
│   │   └── user/            # 사용자 관리
│   ├── lib/                 # 공통 라이브러리 및 유틸리티
│   │   ├── prisma.ts        # Prisma Client 인스턴스
│   │   └── errors/          # 커스텀 에러 클래스
│   ├── middlewares/         # 공통 미들웨어 (에러 핸들러, 비동기 래퍼 등)
│   ├── structs/             # 데이터 구조 및 인터페이스
│   └── types/               # 타입 정의 파일 (.d.ts)
├── .prettierrc              # 코드 스타일 설정
├── package.json             # 의존성 및 스크립트 설정
├── tsconfig.json            # TypeScript 컴파일러 설정
└── README.md                # 프로젝트 문서
```

---

## 실행 방법

### 1. 환경 변수 설정
`.env` 파일을 생성하고 아래 내용을 환경에 맞춰 입력합니다.
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3000
JWT_SECRET_KEY="your_jwt_secret"

AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="your_aws_region"
AWS_BUCKET_NAME="your_bucket_name"
```

### 2. 의존성 설치 및 데이터베이스 설정
```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 적용
npx prisma migrate dev

# 초기 데이터 시드 (필요시)
npx prisma db seed
```

### 3. 애플리케이션 실행
```bash
# 개발 모드 (nodemon + ts-node)
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm run start
```

---

## 개발 컨벤션
- **모듈화**: 각 기능은 `src/modules` 아래에 컨트롤러, 서비스, 리포지토리, 라우터로 분리하여 관리합니다.
- **의존성 주입**: InversifyJS를 활용하여 각 계층 간의 의존성을 주입합니다.
- **비동기 처리**: `asyncHandler` 미들웨어를 사용하여 `try-catch` 중복을 최소화합니다.
- **유효성 검사**: `class-validator`를 통해 요청 데이터의 무결성을 보장합니다.
