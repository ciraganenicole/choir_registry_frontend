import { api } from '@/config/api';

import type {
  CreateLouadoShiftBatchDto,
  CreateLouadoShiftDto,
  LouadoShift,
  LouadoShiftFilters,
  UpdateLouadoShiftDto,
} from './types';

const buildQueryParams = (filters?: LouadoShiftFilters) => {
  if (!filters) return undefined;
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }

  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  return params.toString() ? params : undefined;
};

export const LouadoShiftService = {
  async fetchLouadoShifts(
    filters?: LouadoShiftFilters,
  ): Promise<LouadoShift[]> {
    const params = buildQueryParams(filters);
    const endpoint = params
      ? `/louado-shifts?${params.toString()}`
      : '/louado-shifts';
    const { data } = await api.get(endpoint);
    return data;
  },

  async fetchLouadoShift(id: number): Promise<LouadoShift> {
    const { data } = await api.get(`/louado-shifts/${id}`);
    return data;
  },

  async createLouadoShift(payload: CreateLouadoShiftDto): Promise<LouadoShift> {
    const { data } = await api.post('/louado-shifts', payload);
    return data;
  },

  async updateLouadoShift(
    id: number,
    payload: UpdateLouadoShiftDto,
  ): Promise<LouadoShift> {
    const { data } = await api.patch(`/louado-shifts/${id}`, payload);
    return data;
  },

  async deleteLouadoShift(id: number): Promise<void> {
    await api.delete(`/louado-shifts/${id}`);
  },

  async upsertLouadoShiftBatch(
    payload: CreateLouadoShiftBatchDto,
  ): Promise<LouadoShift[]> {
    const { data } = await api.post('/louado-shifts/batch', payload);
    return data;
  },
};
