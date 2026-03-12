import { User } from '@prisma/client';
import { NotificationRepository } from './notification.repository';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async findUnreadByUserId(userId: User['id']) {
    return await this.notificationRepository.findUnreadByUserId(userId);
  } // isChecked: false 조건

  async markAsRead(notificationId: string) {
    return await this.notificationRepository.markAsRead(notificationId);
  } // isChecked: true, checkedAt: new Date()
}
