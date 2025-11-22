import type { Commission, User, UserCategory } from '../user/type';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
}

export enum AttendanceType {
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
}

export enum AttendanceEventType {
  REHEARSAL = 'REHEARSAL',
  SUNDAY_SERVICE = 'SUNDAY_SERVICE',
  LOUADO = 'LOUADO',
  MUSIC = 'MUSIC',
  COMMITTEE = 'COMMITTEE',
}

export const AttendanceEventTypeLabels: Record<AttendanceEventType, string> = {
  [AttendanceEventType.REHEARSAL]: 'Répétition',
  [AttendanceEventType.SUNDAY_SERVICE]: 'Culte du dimanche',
  [AttendanceEventType.LOUADO]: 'Louado',
  [AttendanceEventType.MUSIC]: 'Musique',
  [AttendanceEventType.COMMITTEE]: 'Comité',
};

export enum JustificationReason {
  ILLNESS = 'ILLNESS',
  BIRTH = 'BIRTH',
  WORK = 'WORK',
  TRAVEL = 'TRAVEL',
  FAMILY_EMERGENCY = 'FAMILY_EMERGENCY',
  SCHOOL = 'SCHOOL',
  OTHER = 'OTHER',
}

export const JustificationReasonLabels: Record<JustificationReason, string> = {
  [JustificationReason.ILLNESS]: 'Maladie',
  [JustificationReason.BIRTH]: 'Naissance',
  [JustificationReason.WORK]: 'Travail',
  [JustificationReason.TRAVEL]: 'Voyage',
  [JustificationReason.FAMILY_EMERGENCY]: 'Urgence familiale',
  [JustificationReason.SCHOOL]: 'École',
  [JustificationReason.OTHER]: 'Autre',
};

export interface AttendanceRecord {
  id?: number;
  userId: number;
  date: string;
  status: AttendanceStatus;
  eventType: AttendanceEventType;
  timeIn?: string;
  type?: AttendanceType;
  justification?: JustificationReason;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    // ... other user fields
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceFilterDto {
  startDate?: string;
  endDate?: string;
  userId?: number;
  eventType?: AttendanceEventType;
  status?: AttendanceStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface EventTypeMapping {
  categories: UserCategory[];
  commissions: Commission[];
}

export type EventTypeToUserMapping = Record<
  AttendanceEventType,
  EventTypeMapping
>;

export interface AttendanceState {
  records: { [userId: number]: AttendanceRecord[] };
  loading: boolean;
  error: null | string;
}

export interface AttendanceHookState {
  users: User[];
  attendance: AttendanceState;
  loading: boolean;
  errorMessage: string | null;
  selectedEventType: AttendanceEventType;
  filters: AttendanceFilterDto;
}
