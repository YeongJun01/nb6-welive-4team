import prisma from '../../lib/prisma';

class NoticeRepository {
  createNotice = async (data: any) => {
    console.log(data);
  };
}

const noticeRepository = new NoticeRepository();
export default noticeRepository;
