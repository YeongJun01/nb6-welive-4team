import { NotificationType, PrismaClient } from '@prisma/client';
import { getIO } from '../../lib/socket';

type notifiType = {
  notiType: NotificationType;
  title: string;
  content: string;
  url: string;
};

export class NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUnreadByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isChecked: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isChecked: true, checkedAt: new Date() },
    });
  }

  async createNotification(tx: any, notificationData: notifiType, userId: string) {
    const notification = await tx.notification.create({
      data: {
        ...notificationData,
        user: { connect: { id: userId } },
      },
    });

    // 실시간 알림 전송
    const io = getIO();
    io.to(userId).emit('notification', {
      notificationId: notification.id,
      title: notification.title,
      content: notification.content,
      notificationType: notification.notiType,
      notifiedAt: notification.createdAt,
      isChecked: notification.isChecked,
      url: notification.url,
    });

    return notification;
  }
}
