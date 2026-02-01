import { api } from '@/config/api';
import type {
  CreateReportDto,
  Report,
  UpdateReportDto,
} from '@/types/report.types';

export const ReportService = {
  /**
   * Fetch all reports (committee members OR super admins)
   */
  async getAllReports(): Promise<Report[]> {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch reports',
      );
    }
  },

  /**
   * Fetch a specific report by ID (committee members OR super admins)
   */
  async getReportById(id: number): Promise<Report> {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch report',
      );
    }
  },

  /**
   * Create a new report (committee members only)
   * Supports multipart/form-data with file upload
   * Note: When using FormData, we need to remove Content-Type header
   * so the browser can set it with the correct boundary
   */
  async createReport(
    data: CreateReportDto | FormData,
    isFormData = false,
  ): Promise<Report> {
    try {
      const config = isFormData
        ? {
            headers: {
              'Content-Type': undefined, // Let browser set it for FormData
            },
          }
        : {};
      const response = await api.post('/reports', data, config);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create report',
      );
    }
  },

  /**
   * Update an existing report (creator or SUPER_ADMIN only)
   * Supports multipart/form-data with file upload
   * Note: When using FormData, we need to remove Content-Type header
   * so the browser can set it with the correct boundary
   */
  async updateReport(
    id: number,
    data: UpdateReportDto | FormData,
    isFormData = false,
  ): Promise<Report> {
    try {
      const config = isFormData
        ? {
            headers: {
              'Content-Type': undefined, // Let browser set it for FormData
            },
          }
        : {};
      const response = await api.patch(`/reports/${id}`, data, config);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update report',
      );
    }
  },

  /**
   * Delete a report (creator or SUPER_ADMIN only)
   */
  async deleteReport(id: number): Promise<void> {
    try {
      await api.delete(`/reports/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete report',
      );
    }
  },

  /**
   * Get reports by date range
   */
  async getReportsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Report[]> {
    try {
      const response = await api.get('/reports', {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch reports',
      );
    }
  },

  /**
   * Get user's report permissions from backend
   */
  async getReportPermissions(): Promise<{
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewAll: boolean;
    canManageOthers: boolean;
  }> {
    try {
      const response = await api.get('/reports/permissions');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch report permissions',
      );
    }
  },
};
