import prisma from '../../lib/prisma';
import { Infer } from 'superstruct';
import eventStruct from './event.validation';

type getEventList = Infer<typeof eventStruct.getEventList>;

class EventRepository {
  findEventListByApartmentId = async (query: getEventList) => {
    const { apartmentId, year, month } = query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const findData = {
      board: { apartmentId },
      startDate: {
        gte: startDate,
        lt: endDate,
      },
    };

    return await prisma.event.findMany({
      where: {
        OR: [{ notice: findData }, { poll: findData }],
      },
      include: {
        notice: true,
        poll: true,
      },
    });
  };
}

const eventRepository = new EventRepository();

export default eventRepository;
