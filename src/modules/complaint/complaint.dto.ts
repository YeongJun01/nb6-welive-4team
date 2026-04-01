import { Prisma, ComplaintStatus } from '@prisma/client';

export type ComplaintListFromDB = Prisma.ComplaintGetPayload<{
  include: {
    creator: { select: { name: true } };
    _count: { select: { comments: true } };
  };
}>;

export type ComplaintDetailFromDB = Prisma.ComplaintGetPayload<{
  include: {
    creator: { select: { name: true } };
    _count: { select: { comments: true } };
    comments: {
      include: {
        user: { select: { name: true } };
      };
    };
  };
}>;

export type GetComplaintListQuery = {
  page: number;
  limit: number;
  orderBy: 'asc' | 'desc';
  status?: ComplaintStatus | 'ALL';
  isPublic: boolean;
  keyword?: string;
  dong?: string;
  ho?: string;
};
