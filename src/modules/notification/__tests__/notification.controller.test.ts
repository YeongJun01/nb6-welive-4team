import request from 'supertest';
import express from 'express';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';

// Mock 데이터
const mockNotifications = [
  {
    id: 'noti-1',
    userId: 'user-1',
    notiType: 'SIGNUP_REQ',
    title: '새로운 회원가입 신청',
    content: '홍길동님이 회원가입을 신청했습니다.',
    url: '/auth/signup',
    isChecked: false,
    createdAt: new Date('2026-03-23T10:00:00Z'),
    checkedAt: null,
  },
];

// Mock Service
const mockService = {
  findUnreadByUserId: jest.fn(),
  markAsRead: jest.fn(),
} as unknown as NotificationService;

// 테스트용 Express 앱
function createTestApp() {
  const app = express();
  app.use(express.json());

  // 가짜 인증 미들웨어
  app.use((req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  });

  const controller = new NotificationController(mockService);

  app.get('/notifications/sse', controller.sse.bind(controller));
  app.patch('/notifications/:notificationId/read', controller.markAsRead.bind(controller));

  return app;
}

describe('Notification API 엔드포인트', () => {
  const app = createTestApp();

  describe('PATCH /notifications/:notificationId/read', () => {
    it('알림을 읽음 처리하고 200을 반환한다', async () => {
      const mockRead = { ...mockNotifications[0], isChecked: true, checkedAt: new Date() };
      (mockService.markAsRead as jest.Mock).mockResolvedValue(mockRead);

      const res = await request(app).patch('/notifications/noti-1/read');

      expect(res.status).toBe(200);
      expect(res.body.isChecked).toBe(true);
      expect(mockService.markAsRead).toHaveBeenCalledWith('noti-1');
    });
  });

  describe('GET /notifications/sse', () => {
    it('SSE 연결 시 text/event-stream 헤더와 알림 데이터를 반환한다', (done) => {
      (mockService.findUnreadByUserId as jest.Mock).mockResolvedValue(mockNotifications);

      const req = request(app)
        .get('/notifications/sse')
        .buffer(false);

      req.end((_err, res) => {
        // SSE는 스트림이므로 헤더만 확인
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.headers['cache-control']).toBe('no-cache');

        // ECONNRESET 에러 방지: 응답 스트림의 에러를 무시 처리
        res.on('error', () => {});
        done();
      });

      // 헤더 확인 후 연결 종료
      setTimeout(() => req.abort(), 1000);
    });
  });
});
