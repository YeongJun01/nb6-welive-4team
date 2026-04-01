import { Request, Response } from 'express';
import noticeService from './notice.service';
import { create, mask } from 'superstruct';
import noticeStruct from './notice.validation';
import commonStruct from '../../structs/common.validation';

class NoticeController {
  createNotice = async (req: Request, res: Response) => {
    const data = create(req.body, noticeStruct.noticeInfo);
    const adminId = req.user!.id;

    await noticeService.createNotice(data, adminId);

    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
  };

  getNoticeList = async (req: Request, res: Response) => {
    const query = create(req.query, noticeStruct.getNoticeList);
    const userId = req.user!.id;

    const noticeList = await noticeService.getNoticeList(query, userId);

    res.status(200).json(noticeList);
  };

  getNoticeDetail = async (req: Request, res: Response) => {
    const noticeId = mask(req.params.noticeId, commonStruct.uuid);
    const userId = req.user!.id;

    const notice = await noticeService.getNoticeDetail(noticeId, userId);

    res.status(200).json(notice);
  };

  updateNotice = async (req: Request, res: Response) => {
    const data = create(req.body, noticeStruct.noticeInfo);
    const noticeId = mask(req.params.noticeId, commonStruct.uuid);
    const userId = req.user!.id;

    const notice = await noticeService.updateNotice(data, noticeId, userId);

    res.status(200).json(notice);
  };

  deleteNotice = async (req: Request, res: Response) => {
    const noticeId = mask(req.params.noticeId, commonStruct.uuid);
    const adminId = req.user!.id;

    await noticeService.deleteNotice(noticeId, adminId);

    res.status(204).json({ message: '정상적으로 삭제 처리되었습니다' });
  };
}

const noticeController = new NoticeController();

export default noticeController;
