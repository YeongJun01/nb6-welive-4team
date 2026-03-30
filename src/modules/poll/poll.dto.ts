import { Prisma } from '@prisma/client';

export type GetPollListFromDB = Prisma.PollGetPayload<{
  include: { board: true; admin: { select: { name: true } } };
}>;

export type GetPollDetailFromDB = Prisma.PollGetPayload<{
  include: {
    board: true;
    admin: { select: { name: true } };
    pollOptions: { select: { id: true; content: true; voteCount: true } };
  };
}>;

export type GetPollListQuery = {
  page: number;
  limit: number;
  orderBy?: 'asc' | 'desc';
  status?: 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
  buildingPermission?: string[];
  keyword?: string;
};
