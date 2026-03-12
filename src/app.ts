import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PORT } from './lib/constants';
import cookieParser from 'cookie-parser';
import apartmentRouter from './modules/apartment/apartment.router';
import { defaultNotFoundHandler, errorHandler } from './middlewares/errorHandler';
import authRouter from './modules/auth/auth.router';
import userRouter from './modules/user/user.router';
import residentListRouter from './modules/residentList/residentList.router';
import pollRouter from './modules/poll/poll.router';
import voteRouter from './modules/vote/vote.router';
import complaintRouter from './modules/complaint/complaint.router';
import notificationRouter from './modules/notification/notification.router';

const app = express();

// Middleware 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, WeLive!');
});

// 라우터 설정
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/polls', pollRouter); // 투표 게시판
app.use('/options', voteRouter); // 투표 옵션
app.use('/complaints', complaintRouter); // 민원 게시판
app.use('/notifications', notificationRouter); // 알림

// 아파트 관련 라우터
app.use('/apartments', apartmentRouter);

// 입주자 목록 관련 라우터
app.use('/residents', residentListRouter);

//404 처리 미들웨어 및 에러 핸들러 등록
app.use(defaultNotFoundHandler);
app.use(errorHandler);

export default app;
