import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { UserRepository } from '../user/user.repository';
import apartmentRepository from '../apartment/apartment.repository';
import prisma from '../../lib/prisma';
import eventRepository from './event.repository';
import { EventFromDB } from './event.dto';
import { EventResponse } from './event.type';

type GetEventListQuery = {
  apartmentId: string;
  year: number;
  month: number;
};

class EventService {
  constructor(private readonly userRepository: UserRepository) {}

  private mapEventList = (eventList: EventFromDB[]): EventResponse[] => {
    return eventList.reduce((result: EventResponse[], event) => {
      const start = event.pollId ? event.poll?.startDate : event.notice?.startDate;
      const end = event.pollId ? event.poll?.endDate : event.notice?.endDate;

      // 날짜가 없는 경우 출력 데이터로 넣지 않음
      if (!start || !end) {
        return result;
      }

      result.push({
        id: event.id,
        start,
        end,
        title: event.title,
        category: event.pollId ? 'RESIDENT_VOTE' : event.notice!.category,
        type: event.pollId ? 'POLL' : 'NOTICE',
      });
      return result;
    }, []);
  };

  getEventList = async (query: GetEventListQuery, userId: string) => {
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
