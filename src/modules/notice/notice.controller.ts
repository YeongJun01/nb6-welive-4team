import { Request, Response } from 'express';
import noticeService from './notice.service';
import { create, mask } from 'superstruct';
import noticeStruct from './notice.validation';
import commonStruct from '../../structs/common.validation';

class NoticeController {
  createNotice = async (req: Request, res: Response) => {
    console.log('hello notice create');
  };
  getNoticeList = async (req: Request, res: Response) => {
    console.log('hello notice list');
  };
  getNoticeDetail = async (req: Request, res: Response) => {
    console.log('hello notice detail');
  };
  updateNotice = async (req: Request, res: Response) => {
    console.log('hello notice update');
  };
  deleteNotice = async (req: Request, res: Response) => {
    console.log('hello notice delete');
  };
}

const noticeController = new NoticeController();

export default noticeController;
