import { api } from '@/config/api';

import type {
  AssignmentStats,
  BulkAssignmentDto,
  BulkCreatePerformanceDto,
  CreatePerformanceDto,
  Performance,
  PerformanceFilterDto,
  PerformanceListResponse,
  PerformanceStats,
  PerformanceType,
  PromotableRehearsal,
  PromotionResult,
  UnassignedPerformance,
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
      throw new Error(
        error.response?.data?.message || 'Failed to update performance',
      );
    }
  },

  deletePerformance: async (id: number): Promise<void> => {
    try {
      await api.delete(`/performances/${id}`);
    } catch (error: any) {
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

  fetchUnassignedPerformances: async (): Promise<UnassignedPerformance[]> => {
    try {
      const { data } = await api.get('/performances', {
        params: { limit: 1000 },
      });

      const unassignedPerformances = data.data
        .filter((perf: Performance) => !perf.shiftLeadId)
        .map((perf: Performance) => {
          const daysUntil = Math.ceil(
            (new Date(perf.date).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          let urgencyLevel: 'low' | 'medium' | 'high' = 'low';

          if (daysUntil <= 3) urgencyLevel = 'high';
          else if (daysUntil <= 7) urgencyLevel = 'medium';

          return {
            ...perf,
            daysUntilPerformance: daysUntil,
            urgencyLevel,
          };
        });

      return unassignedPerformances;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          'Failed to fetch unassigned performances',
      );
    }
  },

  bulkCreatePerformances: async (
    data: BulkCreatePerformanceDto,
  ): Promise<Performance[]> => {
    try {
      const promises = data.performances.map(async (performance) => {
        try {
          const response = await api.post('/performances', performance);
          return response.data;
        } catch (error: any) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      return results.filter((result): result is Performance => result !== null);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create bulk performances',
      );
    }
  },

  bulkAssignPerformances: async (
    data: BulkAssignmentDto,
  ): Promise<Performance[]> => {
    try {
      const promises = data.performanceIds.map(async (performanceId) => {
        try {
          const response = await api.patch(`/performances/${performanceId}`, {
            shiftLeadId: data.shiftLeadId,
          });
          return response.data;
        } catch (error: any) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      return results.filter((result): result is Performance => result !== null);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to bulk assign performances',
      );
    }
  },

  assignShiftLead: async (
    performanceId: number,
    shiftLeadId: number,
  ): Promise<Performance> => {
    try {
      const response = await api.patch(`/performances/${performanceId}`, {
        shiftLeadId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to assign shift lead',
      );
    }
  },

  unassignShiftLead: async (performanceId: number): Promise<Performance> => {
    try {
      const response = await api.patch(`/performances/${performanceId}`, {
        shiftLeadId: null,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to unassign shift lead',
      );
    }
  },

  getAssignmentStats: async (): Promise<AssignmentStats> => {
    try {
      const { data } = await api.get('/performances', {
        params: { limit: 1000 },
      });

      const performances = data.data;
      const unassigned = performances.filter(
        (perf: Performance) => !perf.shiftLeadId,
      );
      const urgent = unassigned.filter((perf: Performance) => {
        const daysUntil = Math.ceil(
          (new Date(perf.date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return daysUntil <= 7;
      });

      const byType = unassigned.reduce(
        (acc: Record<string, number>, perf: Performance) => {
          acc[perf.type] = (acc[perf.type] || 0) + 1;
          return acc;
        },
        {},
      );

      return {
        totalUnassigned: unassigned.length,
        urgentCount: urgent.length,
        overdueCount: 0,
        byType,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch assignment stats',
      );
    }
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
      const response = await api.post(
        `/performances/promote-rehearsal/${rehearsalId}`,
      );
      return response.data;
    } catch (error: any) {
      console.error('Promotion API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });

      if (error.response?.status === 401) {
        throw new Error('Authentication required - please log in');
      } else if (error.response?.status === 403) {
        throw new Error(
          'Permission denied - you need SUPER_ADMIN or LEAD role',
        );
      } else if (error.response?.status === 404) {
        throw new Error('Rehearsal not found or endpoint not available');
      } else if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Rehearsal cannot be promoted - check status and requirements';
        throw new Error(errorMessage);
      }

      throw new Error(
        error.response?.data?.message || 'Failed to promote rehearsal',
      );
    }
  },

  replaceRehearsal: async (rehearsalId: number): Promise<Performance> => {
    try {
      const response = await api.post(
        `/performances/replace-rehearsal/${rehearsalId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to replace rehearsal',
      );
    }
  },

  getPromotableRehearsals: async (): Promise<PromotableRehearsal[]> => {
    try {
      const { data } = await api.get('/performances/promotable-rehearsals');
      return data;
    } catch (error: any) {
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
      const response = await api.post('/performances/promote-rehearsals', {
        rehearsalIds,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to promote rehearsals',
      );
    }
  },
};
