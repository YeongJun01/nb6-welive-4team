import { Request, Response } from 'express';
import complaintService from './complaint.service';

class ComplaintController {
  createComplaint = async (req: Request, res: Response) => {
    console.log('test complaint create controller');

    await complaintService.createComplaint(1);
  };

  getComplaintList = async (req: Request, res: Response) => {
    console.log('test complaint controller list');

    await complaintService.getComplaintList(1);
  };

  getComplaintDetail = async (req: Request, res: Response) => {
    console.log('test complaint controller detail');

    await complaintService.getComplaintDetail(1);
  };

  updateComplaint = async (req: Request, res: Response) => {
    console.log('test complaint update controller');

    await complaintService.updateComplaint(1);
  };

  updateComplaintStatus = async (req: Request, res: Response) => {
    console.log('test complaint status update controller');

    await complaintService.updateComplaintStatus(1);
  };

  deleteComplaint = async (req: Request, res: Response) => {
    console.log('test complaint delete controller');

    await complaintService.deleteComplaint(1);
  };
}

const complaintController = new ComplaintController();

export default complaintController;
