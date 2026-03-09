import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PORT } from './lib/constants';
import cookieParser from 'cookie-parser';
import apartmentRouter from './modules/apartment/apartment.router';
import { defaultNotFoundHandler, errorHandler } from './middlewares/errorHandler';
import authRouter from './modules/auth/auth.router';
import userRouter from './modules/user/user.router';

const app = express();

// Middleware 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, WeLive!');
});

// 라우터 설정
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

// 아파트 관련 라우터
app.use('/apartments', apartmentRouter);

//404 처리 미들웨어 및 에러 핸들러 등록
app.use(defaultNotFoundHandler);
app.use(errorHandler);

export default app;
