export interface Report {
  id: number;
  title: string;
  meetingDate: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  createdById?: number;
}

export interface CreateReportDto {
  title: string;
  meetingDate: string; // ISO date string (YYYY-MM-DD)
  content: string;
  attachmentUrl?: string;
}

export interface UpdateReportDto {
  title?: string;
  meetingDate?: string;
  content?: string;
  attachmentUrl?: string;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  data?: Report;
  error?: string;
}
