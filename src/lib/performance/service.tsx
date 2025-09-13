import { api } from '@/config/api';

import type {
  CreatePerformanceDto,
  Performance,
  PerformanceFilterDto,
  PerformanceListResponse,
  PerformanceStats,
  PerformanceType,
  PromotableRehearsal,
  PromotionResult,
  UpdatePerformanceDto,
} from './types';

interface QueryParams extends PerformanceFilterDto {
  page: number;
  limit: number;
}

export const PerformanceService = {
  fetchPerformances: async (
    filters: PerformanceFilterDto,
    pagination: { page: number; limit: number },
  ): Promise<PerformanceListResponse> => {
    try {
      const queryParams: QueryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key as keyof QueryParams] === undefined ||
          queryParams[key as keyof QueryParams] === null
        ) {
          delete queryParams[key as keyof QueryParams];
        }
      });

      const { data } = await api.get('/performances', { params: queryParams });

      // ✅ FIXED: Consistent response handling like rehearsal service
      let performances;
      let total;
      if (Array.isArray(data) && data.length === 2) {
        [performances, total] = data;
      } else if (data.data && typeof data.total === 'number') {
        performances = data.data;
        total = data.total;
      } else {
        performances = data;
        total = data.length;
      }

      const page = pagination.page;
      const limit = pagination.limit;
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: performances || [],
        total: total || 0,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error: any) {
      console.error('Error fetching performances:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch performances',
      );
    }
  },

  fetchPerformance: async (id: number): Promise<Performance> => {
    try {
      const { data } = await api.get(`/performances/${id}`);
      return data;
    } catch (error: any) {
      console.error('Error fetching performance:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch performance',
      );
    }
  },

  createPerformance: async (
    data: CreatePerformanceDto,
  ): Promise<Performance> => {
    try {
      const response = await api.post('/performances', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating performance:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to create performance',
      );
    }
  },

  updatePerformance: async (
    id: number,
    data: UpdatePerformanceDto,
  ): Promise<Performance> => {
    try {
      const response = await api.patch(`/performances/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating performance:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update performance',
      );
    }
  },

  deletePerformance: async (id: number): Promise<void> => {
    try {
      await api.delete(`/performances/${id}`);
    } catch (error: any) {
      console.error('Error deleting performance:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to delete performance',
      );
    }
  },

  fetchStats: async (): Promise<PerformanceStats> => {
    const { data } = await api.get('/performances/stats');
    return data;
  },

  findBySong: async (songId: number): Promise<Performance[]> => {
    const { data } = await api.get(`/performances/song/${songId}`);
    return data;
  },

  findByUser: async (userId: number): Promise<Performance[]> => {
    const { data } = await api.get(`/performances/user/${userId}`);
    return data;
  },

  fetchMyPerformances: async (): Promise<Performance[]> => {
    const { data } = await api.get('/performances/my-performances');
    return data;
  },

  fetchPerformanceTypes: async (): Promise<PerformanceType[]> => {
    const { data } = await api.get('/performances/types');
    return data;
  },

  fetchInstruments: async (): Promise<string[]> => {
    const { data } = await api.get('/performances/instruments');
    return data;
  },

  promoteRehearsal: async (rehearsalId: number): Promise<Performance> => {
    try {
      // ✅ FIXED: Updated to new endpoint format - removed performanceId from URL
      // This now ADDS songs instead of replacing them
      const response = await api.post(
        `/performances/promote-rehearsal/${rehearsalId}`,
      );
      return response.data;
    } catch (error: any) {
      console.error('Error promoting rehearsal:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to promote rehearsal',
      );
    }
  },

  replaceRehearsal: async (rehearsalId: number): Promise<Performance> => {
    try {
      // This REPLACES all existing songs with rehearsal songs
      const response = await api.post(
        `/performances/replace-rehearsal/${rehearsalId}`,
      );
      return response.data;
    } catch (error: any) {
      console.error('Error replacing rehearsal:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to replace rehearsal',
      );
    }
  },

  // ============================================================================
  // Bulk Rehearsal Promotion Functions
  // ============================================================================

  getPromotableRehearsals: async (): Promise<PromotableRehearsal[]> => {
    try {
      const { data } = await api.get('/performances/promotable-rehearsals');
      return data;
    } catch (error: any) {
      console.error('Error fetching promotable rehearsals:', error);
      throw new Error(
        error.response?.data?.message ||
          'Failed to fetch promotable rehearsals',
      );
    }
  },

  promoteRehearsals: async (
    rehearsalIds: number[],
  ): Promise<PromotionResult> => {
    try {
      // Bulk promotion uses ADD mode by default - adds songs without replacing
      const response = await api.post('/performances/promote-rehearsals', {
        rehearsalIds,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error promoting rehearsals:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to promote rehearsals',
      );
    }
  },
};
