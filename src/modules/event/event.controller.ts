import { Request, Response } from 'express';
import { mask } from 'superstruct';
import eventStruct from './event.validation';

class EventController {
  // 이벤트 목록 조회
  getEventList = async (req: Request, res: Response) => {
    console.log('hello event');
  };
}

const eventController = new EventController();

export default eventController;
