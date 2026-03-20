import { NotificationType, PrismaClient } from '@prisma/client';

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
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isChecked: true, checkedAt: new Date() },
    });
  }

  async createNotification(tx: any, notificationData: notifiType, userId : string) {
    await tx.notification.create({
      data: {
        ...notificationData,
        user: { connect: { id: userId } },
      },
    });
  }
}
