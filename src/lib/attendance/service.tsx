import { api } from '@/config/api';

import type { AttendanceRecord } from './types';

export const AttendanceService = {
  fetchUnjustifiedWeeklyAbsences: async (): Promise<AttendanceRecord[]> => {
    try {
      const response = await api.get('/attendance/unjustified-weekly');
      return response.data || [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          'Failed to fetch unjustified weekly absences',
      );
    }
  },
};
