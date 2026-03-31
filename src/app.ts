import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN } from './lib/constants';
import cookieParser from 'cookie-parser';
import apartmentRouter from './modules/apartment/apartment.router';
import { defaultNotFoundHandler, errorHandler } from './middlewares/errorHandler';
import authRouter from './modules/auth/auth.router';
import userRouter from './modules/user/user.router';
import residentListRouter from './modules/residentList/residentList.router';
import pollRouter from './modules/poll/poll.router';
import voteRouter from './modules/vote/vote.router';
import complaintRouter from './modules/complaint/complaint.router';
import noticeRouter from './modules/notice/notice.router';
import notificationRouter from './modules/notification/notification.router';
import commentRouter from './modules/comment/comment.router';
import eventRouter from './modules/event/event.router';
import { FRONTEND_URL } from './lib/constants';

const app = express();

// Middleware 설정
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Authorization'], // 백엔드(Server) → 프론트엔드(Client), 백엔드 Response에서 Authorization 헤더를 프론트엔드로 전달
    allowedHeaders: ['Content-Type', 'Authorization'], // 프론트엔드(Client) → 백엔드(Server), 클라이언트 Request에서 Authorization 헤더를 백엔드로 전달
  }),
);

app.get('/', (req, res) => {
  res.send('Hello, WeLive!');
});

// 라우터 설정
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/polls', pollRouter); // 투표 게시판
app.use('/options', voteRouter); // 투표 옵션
app.use('/complaints', complaintRouter); // 민원 게시판
app.use('/notices', noticeRouter); // 공지 게시판
app.use('/notifications', notificationRouter); // 알림
app.use('/apartments', apartmentRouter); // 아파트 관련 라우터
app.use('/residents', residentListRouter); // 입주자 목록 관련 라우터
app.use('/comments', commentRouter); // 댓글
app.use('/events', eventRouter); // 이벤트 게시판

//404 처리 미들웨어 및 에러 핸들러 등록
app.use(defaultNotFoundHandler);
app.use(errorHandler);

export default app;
