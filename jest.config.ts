export default {
  // 1. preset: ts-jest를 사용한다고 선언
  preset: 'ts-jest',
  // 2. testEnvironment: 브라우저가 아니라 Node.js 환경
  testEnvironment: 'node',
  // 3. testMatch: src 폴더 안의 .test.ts 파일들을 찾는 패턴
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // 4. moduleFileExtensions: ts, js 확장자 인식
  moduleFileExtensions: ['ts', 'js'],
  // 5. setupFiles: 테스트 시작 전 환경 변수 등을 로드할 파일
  setupFiles: ['<rootDir>/src/test/setupEnv.ts'],
  // 6. setupFilesAfterEnv: 테스트 프레임워크가 설치된 후 실행할 파일
  // setupFilesAfterEnv: ['./src/lib/prisma.mock.ts'],
  // 7. clearMocks: 각 테스트 후 자동으로 mock 초기화
  clearMocks: true,
  // 8. resetMocks: 각 테스트 후 mock 초기화
  resetMocks: true,
  // 9. restoreMocks: 각 테스트 후 mock 복원
  restoreMocks: true,
  // 10. coverageDirectory: 커버리지 리포트 저장 경로
  coverageDirectory: 'coverage',
  // 11. coverageReporters: 커버리지 리포트 형식
  coverageReporters: ['text', 'html'],
};
