import { Request, Response } from 'express';
import noticeService from './notice.service';
import { create, mask } from 'superstruct';
import noticeStruct from './notice.validation';
import commonStruct from '../../structs/common.validation';

class NoticeController {
  createNotice = async (req: Request, res: Response) => {
    const data = create(req.body, noticeStruct.createNotice);
    const adminId = 'd4b4b700-2c46-4a0f-b7f7-7e1705b41546'; // admin 정보, 업데이트 필요

    const notice = await noticeService.createNotice(data, adminId);

    res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
  };
  getNoticeList = async (req: Request, res: Response) => {
    console.log('hello notice list');
  };

  getNoticeDetail = async (req: Request, res: Response) => {
    console.log('hello notice detail');
  };

  updateNotice = async (req: Request, res: Response) => {
    const data = create(req.body, noticeStruct.updateNotice);
    const noticeId = mask(req.params.noticeId, commonStruct.uuid);

    const notice = await noticeService.updateNotice(data, noticeId);

    res.status(201).json(notice);
  };

  deleteNotice = async (req: Request, res: Response) => {
    const noticeId = mask(req.params.noticeId, commonStruct.uuid);
    const adminId = 'd4b4b700-2c46-4a0f-b7f7-7e1705b41546'; // admin 정보, 업데이트 필요
    // const boardId = 'd4b4b700-2c46-4a0f-b7f7-7e1705b41546'; // board 정보, 업데이트 필요

    const notice = await noticeService.deleteNotice(noticeId, adminId);

    res.status(201).json({ message: '정상적으로 삭제 처리되었습니다' });
  };
}

const noticeController = new NoticeController();

export default noticeController;
