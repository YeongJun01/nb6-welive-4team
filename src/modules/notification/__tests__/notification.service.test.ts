import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../notification.repository';

const mockNotifications = [
  {
    id: 'noti-1',
    userId: 'user-1',
    notiType: 'SIGNUP_REQ' as const,
    title: '새로운 회원가입 신청',
    content: '홍길동님이 회원가입을 신청했습니다.',
    url: '/auth/signup',
    isChecked: false,
    createdAt: new Date('2026-03-23T10:00:00Z'),
    checkedAt: null,
  },
  {
    id: 'noti-2',
    userId: 'user-1',
    notiType: 'COMPLAINT_RAISED' as const,
    title: '새로운 민원이 등록되었습니다.',
    content: '민원 테스트',
    url: '/complaints/abc',
    isChecked: false,
    createdAt: new Date('2026-03-23T09:00:00Z'),
    checkedAt: null,
  },
];

const mockRepository = {
  findUnreadByUserId: jest.fn(),
  markAsRead: jest.fn(),
  createNotification: jest.fn(),
} as unknown as NotificationRepository;

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(mockRepository);
  });

  describe('findUnreadByUserId', () => {
    it('읽지 않은 알림 목록을 반환한다', async () => {
      (mockRepository.findUnreadByUserId as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await service.findUnreadByUserId('user-1');

      expect(mockRepository.findUnreadByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].isChecked).toBe(false);
    });

    it('읽지 않은 알림이 없으면 빈 배열을 반환한다', async () => {
      (mockRepository.findUnreadByUserId as jest.Mock).mockResolvedValue([]);

      const result = await service.findUnreadByUserId('user-999');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('알림을 읽음 처리한다', async () => {
      const mockRead = { ...mockNotifications[0], isChecked: true, checkedAt: new Date() };
      (mockRepository.markAsRead as jest.Mock).mockResolvedValue(mockRead);

      const result = await service.markAsRead('noti-1');

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('noti-1');
      expect(result.isChecked).toBe(true);
      expect(result.checkedAt).toBeDefined();
    });
  });
});
