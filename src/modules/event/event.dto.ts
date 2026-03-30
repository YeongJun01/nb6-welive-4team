import { Prisma } from '@prisma/client';

export type EventFromDB = Prisma.EventGetPayload<{
  include: {
    notice: true;
    poll: true;
  };
}>;
