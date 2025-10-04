export interface Communique {
  id: number;
  title: string;
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

export interface CreateCommuniqueDto {
  title: string;
  content: string;
  attachmentUrl?: string;
}

export interface UpdateCommuniqueDto {
  title?: string;
  content?: string;
  attachmentUrl?: string;
}

export interface CommuniqueResponse {
  success: boolean;
  message?: string;
  data?: Communique;
  error?: string;
}
