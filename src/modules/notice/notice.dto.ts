import { Prisma, NoticeType } from '@prisma/client';

export type GetNoticeListFromDB = Prisma.NoticeGetPayload<{
  include: {
    admin: { select: { name: true } };
    _count: { select: { comments: true } };
  };
}>;

export type GetNoticeDetailFromDB = Prisma.NoticeGetPayload<{
  include: {
    admin: { select: { name: true } };
    _count: { select: { comments: true } };
    comments: {
      include: {
        user: { select: { name: true } };
      };
    };
  };
}>;

export type GetNoticeListQuery = {
  page: number;
  limit: number;
  category?: NoticeType;
  search?: string | undefined;
  orderBy?: 'desc' | 'asc';
};
