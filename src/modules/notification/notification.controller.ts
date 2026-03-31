import { Request, Response } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async sse(req: Request, res: Response) {
    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    const userId = req.user!.id;

    // 알림 조회 후 전송하는 함수
    const sendNotifications = async () => {
      try {
        const notifications = await this.notificationService.findUnreadByUserId(userId);
        const data = notifications.map((n) => ({
          notificationId: n.id,
          title: n.title,
          content: n.content,
          notificationType: n.notiType,
          notifiedAt: n.createdAt,
          isChecked: n.isChecked,
          url: n.url,
        }));
        // res.write(`data: ${JSON.stringify({ type: 'alarm', data })}\n\n`);

        // 프론트엔드의 eventSource.addEventListener('alarm', ...)와 매칭
        res.write(`event: alarm\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('❌ [SSE] Error sending notification:', error);
      }
    };

    // 1. 최초 연결 시 즉시 전송
    await sendNotifications();

    // 2. 30초마다 반복 전송
    const intervalId = setInterval(sendNotifications, 30000);

    // 3. 연결 종료 시 인터벌 정리
    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });
  }

  async markAsRead(req: Request, res: Response) {
    const notificationId = req.params.notificationId as string;
    const notification = await this.notificationService.markAsRead(notificationId);
    res.status(200).json(notification);
  }
}
