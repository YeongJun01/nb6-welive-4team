import { BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { UserRepository } from '../user/user.repository';
import apartmentRepository from '../apartment/apartment.repository';
import prisma from '../../lib/prisma';
import eventRepository from './event.repository';

class EventService {
  constructor(private readonly userRepository: UserRepository) {}

  private mapEventList = (eventList: any) => {
    return eventList.map((event: any) => {
      return {
        id: event.id,
        type: event.pollId ? 'poll' : 'notice',
        title: event.title,
        startDate: event.pollId ? event.poll.startDate : event.notice.startDate,
        endDate: event.pollId ? event.poll.endDate : event.notice.endDate,
        category: event.pollId ? 'RESIDENT_VOTE' : event.notice.category,
      };
    });
  };

  getEventList = async (query: any, userId: string) => {
    const user = await this.userRepository.findUserByUnique({ id: userId });

    if (!user) {
      throw new NotFoundError('사용자 정보를 찾을 수 없습니다');
    }

    const apartment = await apartmentRepository.getApartmentById(query.apartmentId);

    if (!apartment) {
      throw new NotFoundError('아파트 정보를 찾을 수 없습니다');
    }

    if (user.apartmentId !== query.apartmentId) {
      throw new ForbiddenError('아파트 정보가 일치하지 않아 이벤트를 조회할 수 없습니다');
    }

    const eventList = await eventRepository.findEventListByApartmentId(query);

    return this.mapEventList(eventList);
  };
}

const userRepository = new UserRepository(prisma);
const eventService = new EventService(userRepository);

export default eventService;
