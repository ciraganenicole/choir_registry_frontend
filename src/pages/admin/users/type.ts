interface Leave {
  startDate: string;
  endDate: string;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  phoneNumber: string;
  matricule: string;
  key: string | null;
  leaves: Leave[];
  created_at: string;
}
