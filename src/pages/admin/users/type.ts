export enum Gender {
  FEMALE = 'F',
  MALE = 'M',
}

export enum MaritalStatus {
  SINGLE = 'CELIBATAIRE',
  MARRIED = 'MARIE(E)',
  WIDOWED = 'VEUF(VE)',
  DIVORCED = 'DIVORCE(E)',
}

export enum EducationLevel {
  NONE = 'N/A',
  CERTIFICATE = 'CERTIFICAT',
  A3 = 'A3',
  A2 = 'A2',
  INCOMPLETE_HUMANITIES = 'HUMANITE_INCOMPLETE',
  STATE_DIPLOMA = 'DIPLOME_ETAT',
  GRADUATE = 'GRADUE',
  BACHELOR = 'LICENCIE',
  MASTER = 'MASTER',
  DOCTOR = 'DOCTEUR',
}

export enum Profession {
  FREELANCE = 'LIBERAL',
  CIVIL_SERVANT = 'FONCTIONNAIRE',
  NGO_WORKER = 'AGENT_ONG',
  UNEMPLOYED = 'SANS_EMPLOI',
}

export enum Commune {
  GOMA = 'GOMA',
  KARISIMBI = 'KARISIMBI',
}

export enum Commission {
  SINGING_MUSIC = 'CHANT_MUSIQUE',
  DISCIPLINE = 'DISCIPLINE',
  AESTHETICS = 'ESTHETIQUE',
  INTERCESSION = 'INTERCESSION',
  SOCIAL = 'SOCIAL',
}

export enum UserCategory {
  WORSHIPPER = 'WORSHIPPER',
  COMMITTEE = 'COMMITTEE',
}

interface Attendance {
  id: number;
  date: string;
  status: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  educationLevel: EducationLevel;
  profession: Profession;
  competenceDomain?: string;
  churchOfOrigin: string;
  commune: Commune;
  quarter: string;
  reference: string;
  address: string;
  phoneNumber: string;
  profilePicture?: string;
  whatsappNumber?: string;
  email?: string;
  commissions: Commission[];
  matricule: string;
  categories: UserCategory[];
  fingerprintData?: string;
  joinDate?: Date;
  isActive: boolean;
  attendance: Attendance[];
}

export interface UserFilters {
  search?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  educationLevel?: EducationLevel;
  profession?: Profession;
  commune?: Commune;
  commission?: Commission;
  category?: UserCategory;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  letter?: string;
}
