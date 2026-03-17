import { Request, Response } from 'express';
import { mask } from 'superstruct';
import eventStruct from './event.validation';
import eventService from './event.service';

class EventController {
  // 이벤트 목록 조회
  getEventList = async (req: Request, res: Response) => {
    const query = mask(req.query, eventStruct.getEventList);
    const userId = req.user!.id;

    const eventList = await eventService.getEventList(query, userId);
    res.status(200).json(eventList);
  };
}

const eventController = new EventController();

export default eventController;
