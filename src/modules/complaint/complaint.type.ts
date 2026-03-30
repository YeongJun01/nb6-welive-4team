export interface ComplaintResponse {
  complaintId: string;
  userId: string;
  title: string;
  writerName?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: string;
  dong: string;
  ho: string;
}

export interface ComplaintDetailResponse extends ComplaintResponse {
  content: string;
  boardType: string;
  comments: {
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    writerName: string;
  }[];
}
