import { Request, Response } from 'express';

class ComplaintService {
  createComplaint = async (data: any) => {
    console.log('test complaint create', data);
  };

  getComplaintList = async (data: any) => {
    console.log('test complaint list', data);
  };

  getComplaintDetail = async (data: any) => {
    console.log('test complaint detail', data);
  };

  updateComplaint = async (data: any) => {
    console.log('test complaint update', data);
  };

  updateComplaintStatus = async (data: any) => {
    console.log('test complaint update status', data);
  };

  deleteComplaint = async (data: any) => {
    console.log('test complaint delete', data);
  };
}

const complaintService = new ComplaintService();

export default complaintService;
