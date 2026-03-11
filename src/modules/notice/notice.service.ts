import { BadRequestError } from '../../lib/errors/BadRequestError';
import noticeRepository from './notice.repository';

class NoticeService {
  createNotice = async (data: any) => {
    const notice = await noticeRepository.createNotice(data);
    return notice;
  };
}

const noticeService = new NoticeService();
export default noticeService;
