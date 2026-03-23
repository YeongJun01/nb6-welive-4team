# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Welive — 아파트 커뮤니티 플랫폼 백엔드 (Express.js v5 + TypeScript + Prisma + PostgreSQL). 입주민 관리, 민원, 투표, 공지, 알림, 일정, 댓글 등의 REST API를 제공한다.

## 명령어

```bash
npm run dev          # 개발 서버 실행 (nodemon + ts-node + tsconfig-paths)
npm run build        # TypeScript 컴파일 → dist/
npm run start        # 컴파일된 빌드 실행 (node dist/main.js)
npm run test         # Jest 테스트 실행
npx prisma migrate dev          # 마이그레이션 적용
npx prisma generate             # 스키마 변경 후 Prisma Client 재생성
npx prisma db seed              # 시드 데이터 삽입 (prisma/seed.mjs)
```

## 아키텍처

### 계층형 모듈 구조

각 기능은 `src/modules/<feature>/` 아래 일관된 패턴으로 구성된다:

- **Router** → Express 라우트 정의, `authMiddleware`와 `asyncHandler` 적용
- **Controller** → 요청 파싱, Service에 위임, 응답 포맷팅
- **Service** → 비즈니스 로직, `src/lib/errors/`의 커스텀 에러 throw
- **Repository** → Prisma 쿼리만 담당
- **DTO / Validation** → `superstruct` 기반 검증 (`<feature>.validation.ts`)

모듈 목록: `auth`, `user`, `apartment`, `residentList`, `complaint`, `poll`, `vote`, `notice`, `notification`, `comment`, `event`

### 의존성 연결

Router 파일에서 Repository → Service → Controller를 수동 인스턴스화한다 (InversifyJS 의존성은 있지만 아직 완전히 적용되지 않음). Controller 메서드는 `.bind(controller)`로 `this` 컨텍스트를 유지한다.

### 주요 파일

- `src/app.ts` — Express 앱 설정, 미들웨어 스택, 라우트 등록
- `src/main.ts` — 서버 진입점, cron job 초기화
- `src/lib/prisma.ts` — Prisma Client 싱글톤
- `src/lib/constants.ts` — 환경 상수 (PORT, JWT_SECRET_KEY, DATABASE_URL)
- `src/middlewares/errorHandler.ts` — 커스텀 에러를 HTTP 상태 코드로 매핑하는 중앙 에러 핸들러
- `prisma/schema.prisma` — 전체 데이터 모델 및 관계 정의

### 인증

Authorization 헤더의 JWT Bearer 토큰 사용. Refresh 토큰은 httpOnly 쿠키에 저장. `authMiddleware`가 JWT를 검증하고 `req.user`에 사용자 정보를 설정한다.

### 에러 처리

커스텀 에러 클래스 (`BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) → `asyncHandler`가 캐치 → `errorHandler` 미들웨어가 HTTP 응답으로 변환.

### 주요 규칙

- Soft delete: `deletedAt` 필드 사용 — 쿼리 시 항상 `deletedAt: null` 조건 필요
- 사용자 역할: `USER`, `ADMIN`, `SUPER_ADMIN`
- Socket.io를 통한 실시간 알림
- 파일 업로드는 multer-s3를 통해 AWS S3로 전송
- node-cron으로 투표 상태 자동 전환

### 코드 포맷팅

- Prettier: 작은따옴표, 세미콜론, trailing comma (all), 2칸 들여쓰기, 100자 너비

### 배포

AWS EC2 + PM2 + Nginx 리버스 프록시. 데이터베이스는 AWS RDS PostgreSQL. 파일 저장소는 AWS S3.
