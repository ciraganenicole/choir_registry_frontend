import type { User } from '@/lib/user/type';

export interface LouadoShift {
  id: number;
  date: string;
  louangeId: number;
  adorationId: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  louange?: User;
  adoration?: User;
}

export interface CreateLouadoShiftDto {
  date: string;
  louangeId: number;
  adorationId: number;
  notes?: string | null;
}

export interface UpdateLouadoShiftDto {
  date?: string;
  louangeId?: number;
  adorationId?: number;
  notes?: string | null;
}

export interface LouadoShiftFilters {
  startDate?: string;
  endDate?: string;
}

export interface CreateLouadoShiftAssignment {
  date: string;
  louangeId: number;
  adorationId: number;
  notes?: string | null;
}

export interface CreateLouadoShiftBatchDto {
  assignments: CreateLouadoShiftAssignment[];
}
