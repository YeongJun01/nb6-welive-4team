import { Request, Response } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async sse(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const userId = req.user!.id;
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
    res.write(`data: ${JSON.stringify({ type: 'alarm', data })}\n\n`);
    req.on('close', () => res.end());
  }

  async markAsRead(req: Request, res: Response) {
    const notificationId = req.params.notificationId as string;
    const notification = await this.notificationService.markAsRead(notificationId);
    res.status(200).json(notification);
  }
}
