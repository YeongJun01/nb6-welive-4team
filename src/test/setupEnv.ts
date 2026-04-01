import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// .env.test 파일 경로 설정
const envTestPath = path.resolve(process.cwd(), '.env.test');

if (fs.existsSync(envTestPath)) {
  // .env.test가 있으면 우선 로드
  dotenv.config({ path: envTestPath, override: true });
} else {
  // .env.test가 없으면 기본 .env를 로드
  dotenv.config();
}
