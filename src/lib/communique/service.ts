import { api } from '@/config/api';
import type {
  Communique,
  CreateCommuniqueDto,
  UpdateCommuniqueDto,
} from '@/types/communique.types';

export const CommuniqueService = {
  // Public endpoints (no authentication required)

  /**
   * Fetch all communiques (public)
   */
  async getAllCommuniques(): Promise<Communique[]> {
    try {
      const response = await api.get('/communiques');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch announcements',
      );
    }
  },

  /**
   * Fetch a specific communique by ID (public)
   */
  async getCommuniqueById(id: number): Promise<Communique> {
    try {
      const response = await api.get(`/communiques/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch announcement',
      );
    }
  },

  // Admin endpoints (authentication required)

  /**
   * Create a new communique (admin only)
   */
  async createCommunique(data: CreateCommuniqueDto): Promise<Communique> {
    try {
      const response = await api.post('/communiques', data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create announcement',
      );
    }
  },

  /**
   * Update an existing communique (admin only)
   */
  async updateCommunique(
    id: number,
    data: UpdateCommuniqueDto,
  ): Promise<Communique> {
    try {
      const response = await api.patch(`/communiques/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update announcement',
      );
    }
  },

  /**
   * Delete a communique (admin only)
   */
  async deleteCommunique(id: number): Promise<void> {
    try {
      await api.delete(`/communiques/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete announcement',
      );
    }
  },

  /**
   * Get latest communiques (for homepage widget)
   */
  async getLatestCommuniques(limit: number = 3): Promise<Communique[]> {
    try {
      const response = await api.get('/communiques');
      const communiques = response.data;
      return communiques.slice(0, limit);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch latest announcements',
      );
    }
  },

  /**
   * Get user's communique permissions from backend
   */
  async getCommuniquePermissions(): Promise<{
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewAll: boolean;
    canManageOthers: boolean;
  }> {
    try {
      const response = await api.get('/communiques/permissions');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          'Failed to fetch communique permissions',
      );
    }
  },
};
