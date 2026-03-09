import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PORT } from './lib/constants';
import cookieParser from 'cookie-parser';
import apartmentRouter from './modules/apartment/apartment.router';
import { defaultNotFoundHandler, errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, WeLive!');
});

// 라우터 설정

// 아파트 관련 라우터
app.use('/apartments', apartmentRouter);

//404 처리 미들웨어 및 에러 핸들러 등록
app.use(defaultNotFoundHandler);
app.use(errorHandler);

//서버 시작
app.listen(PORT, () => {
  console.log(`team4 Server is running on port ${PORT}`);
});
