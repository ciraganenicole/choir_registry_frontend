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

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  ATTENDANCE_ADMIN = 'ATTENDANCE_ADMIN',
  USER = 'USER',
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  educationLevel: EducationLevel | null;
  profession: Profession | null;
  competenceDomain: string | null;
  churchOfOrigin: string | null;
  commune: Commune | null;
  quarter: string | null;
  reference: string | null;
  address: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  commissions: Commission[];
  matricule: string;
  categories: UserCategory[];
  fingerprintData: string | null;
  voiceCategory: string | null;
  joinDate: string;
  isActive: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  role: UserRole;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  educationLevel?: EducationLevel;
  profession?: Profession;
  commune?: Commune;
  commission?: Commission;
  category?: UserCategory;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  isActive?: boolean;
}
