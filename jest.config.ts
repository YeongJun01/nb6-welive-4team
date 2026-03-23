export default {
  // 1. preset: ts-jest를 사용한다고 선언
  preset: 'ts-jest',
  // 2. testEnvironment: 브라우저가 아니라 Node.js 환경
  testEnvironment: 'node',
  // 3. testMatch: src 폴더 안의 .test.ts 파일들을 찾는 패턴
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // 4. moduleFileExtensions: ts, js 확장자 인식
  moduleFileExtensions: ['ts', 'js'],
  // 5. setupFilesAfterEnv: 테스트 시작 전 실행할 파일
  // setupFilesAfterEnv: ['./src/lib/prisma.mock.ts'],
  // 6. clearMocks: 각 테스트 후 자동으로 mock 초기화
  clearMocks: true,
  // 7. resetMocks: 각 테스트 후 mock 초기화
  resetMocks: true,
  // 8. restoreMocks: 각 테스트 후 mock 복원
  restoreMocks: true,
  // 9. coverageDirectory: 커버리지 리포트 저장 경로
  coverageDirectory: 'coverage',
  // 10. coverageReporters: 커버리지 리포트 형식
  coverageReporters: ['text', 'html'],
};
