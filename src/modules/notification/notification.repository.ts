import { PrismaClient } from '@prisma/client';

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
}
