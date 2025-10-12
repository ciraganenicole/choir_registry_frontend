import { api } from '@/config/api';

import type {
  CreateRehearsalDto,
  CreateRehearsalMusicianDto,
  CreateRehearsalSongDto,
  CreateRehearsalVoicePartDto,
  Rehearsal,
  RehearsalFilterDto,
  RehearsalListResponse,
  RehearsalSongsResponse,
  RehearsalStats,
  RehearsalTemplate,
  UpdateRehearsalDto,
  UpdateRehearsalSongDto,
} from './types';

export const RehearsalService = {
  fetchRehearsals: async (
    filters: RehearsalFilterDto = {},
  ): Promise<RehearsalListResponse> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/rehearsals?${params.toString()}`);

      // Handle different response formats
      let data;
      let total;
      if (Array.isArray(response.data) && response.data.length === 2) {
        [data, total] = response.data;
      } else if (
        response.data.data &&
        typeof response.data.total === 'number'
      ) {
        data = response.data.data;
        total = response.data.total;
      } else {
        data = response.data;
        total = data.length;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: data || [],
        total: total || 0,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch rehearsals',
      );
    }
  },

  fetchRehearsal: async (id: number): Promise<Rehearsal> => {
    const { data } = await api.get(`/rehearsals/${id}`);
    return data;
  },

  createRehearsal: async (data: CreateRehearsalDto): Promise<Rehearsal> => {
    console.log('RehearsalService: createRehearsal called with:', data);

    try {
      const response = await api.post('/rehearsals', data);
      console.log('RehearsalService: createRehearsal response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('RehearsalService: createRehearsal error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
      throw error;
    }
  },

  updateRehearsal: async (
    id: number,
    data: UpdateRehearsalDto,
  ): Promise<Rehearsal> => {
    const response = await api.patch(`/rehearsals/${id}`, data);
    return response.data;
  },

  deleteRehearsal: async (id: number): Promise<void> => {
    await api.delete(`/rehearsals/${id}`);
  },

  fetchStats: async (): Promise<RehearsalStats> => {
    const { data } = await api.get('/rehearsals/stats');
    return data;
  },
  addSongToRehearsal: async (
    rehearsalId: number,
    songData: CreateRehearsalSongDto,
  ): Promise<any> => {
    // Don't transform - backend expects leadSingerIds, not leadSingers
    const transformedSongData = {
      ...songData,
      // Filter out musicians without a valid userId (0, null, or undefined)
      musicians:
        songData.musicians?.filter((m) => m.userId && m.userId > 0) || [],
    };

    const endpoint = `/rehearsals/${rehearsalId}/songs`;

    const response = await api.post(endpoint, transformedSongData);

    if (response.data?.rehearsalSongs) {
      return response.data;
    }
    return response.data;
  },
  fetchRehearsalSongs: async (
    rehearsalId: number,
  ): Promise<RehearsalSongsResponse> => {
    const response = await api.get(`/rehearsals/${rehearsalId}/songs`);
    return response.data;
  },

  addMultipleSongsToRehearsal: async (
    rehearsalId: number,
    songsData: CreateRehearsalSongDto[],
  ): Promise<any[]> => {
    const promises = songsData.map((songData) => {
      // Don't transform - backend expects leadSingerIds, not leadSingers
      const transformedSongData = {
        ...songData,
        // Filter out musicians without a valid userId (0, null, or undefined)
        musicians:
          songData.musicians?.filter((m) => m.userId && m.userId > 0) || [],
      };

      return api.post(`/rehearsals/${rehearsalId}/songs`, transformedSongData);
    });

    const responses = await Promise.all(promises);
    return responses.map((response) => response.data);
  },

  addSongsToExistingRehearsal: async (
    rehearsalId: number,
    songsData: CreateRehearsalSongDto[],
  ): Promise<any[]> => {
    if (!rehearsalId) {
      throw new Error('Rehearsal ID is required to add songs');
    }

    return RehearsalService.addMultipleSongsToRehearsal(rehearsalId, songsData);
  },

  updateRehearsalSong: async (
    rehearsalId: number,
    songId: number,
    songData: UpdateRehearsalSongDto,
  ): Promise<any> => {
    try {
      const updateData: any = {};

      if (songData.difficulty !== undefined)
        updateData.difficulty = songData.difficulty;
      if (songData.needsWork !== undefined)
        updateData.needsWork = songData.needsWork;
      if (songData.order !== undefined) updateData.order = songData.order;
      if (songData.timeAllocated !== undefined)
        updateData.timeAllocated = songData.timeAllocated;
      if (songData.focusPoints !== undefined)
        updateData.focusPoints = songData.focusPoints;
      if (songData.notes !== undefined) updateData.notes = songData.notes;
      if (songData.musicalKey !== undefined)
        updateData.musicalKey = songData.musicalKey;

      if (songData.leadSingerIds !== undefined) {
        updateData.leadSingerIds = songData.leadSingerIds;
      }
      if (songData.chorusMemberIds !== undefined) {
        updateData.chorusMemberIds = songData.chorusMemberIds;
      }
      if (songData.musicians !== undefined) {
        // Filter out musicians without a valid userId (0, null, or undefined)
        updateData.musicians = songData.musicians.filter(
          (m) => m.userId && m.userId > 0,
        );
      }
      if (songData.voiceParts !== undefined) {
        updateData.voiceParts = songData.voiceParts;
      }

      const response = await api.patch(
        `/rehearsals/${rehearsalId}/songs/${songId}`,
        updateData,
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update rehearsal song',
      );
    }
  },

  deleteRehearsalSong: async (
    rehearsalId: number,
    songId: number,
  ): Promise<void> => {
    try {
      await api.delete(`/rehearsals/${rehearsalId}/songs/${songId}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        await api.delete(`/rehearsals/${rehearsalId}/songs/${songId}/remove`);
      } else {
        throw error;
      }
    }
  },

  deleteSongFromRehearsal: async (
    rehearsalId: number,
    songId: number,
  ): Promise<void> => {
    await api.delete(`/rehearsals/${rehearsalId}/songs/${songId}`);
  },
  addMusicianToSong: async (
    songId: number,
    musicianData: CreateRehearsalMusicianDto,
  ): Promise<any> => {
    const response = await api.post(
      `/rehearsals/songs/${songId}/musicians`,
      musicianData,
    );
    return response.data;
  },

  updateSongMusician: async (
    songId: number,
    musicianId: number,
    musicianData: Partial<CreateRehearsalMusicianDto>,
  ): Promise<any> => {
    const response = await api.patch(
      `/rehearsals/songs/${songId}/musicians/${musicianId}`,
      musicianData,
    );
    return response.data;
  },

  deleteSongMusician: async (
    songId: number,
    musicianId: number,
  ): Promise<void> => {
    await api.delete(`/rehearsals/songs/${songId}/musicians/${musicianId}`);
  },

  addVoicePartToSong: async (
    songId: number,
    voicePartData: CreateRehearsalVoicePartDto,
  ): Promise<any> => {
    const response = await api.post(
      `/rehearsals/songs/${songId}/voice-parts`,
      voicePartData,
    );
    return response.data;
  },

  updateSongVoicePart: async (
    songId: number,
    voicePartId: number,
    voicePartData: Partial<CreateRehearsalVoicePartDto>,
  ): Promise<any> => {
    const response = await api.patch(
      `/rehearsals/songs/${songId}/voice-parts/${voicePartId}`,
      voicePartData,
    );
    return response.data;
  },

  deleteSongVoicePart: async (
    songId: number,
    voicePartId: number,
  ): Promise<void> => {
    await api.delete(`/rehearsals/songs/${songId}/voice-parts/${voicePartId}`);
  },

  fetchTemplates: async (): Promise<RehearsalTemplate[]> => {
    try {
      const { data } = await api.get('/rehearsals/templates');
      return data;
    } catch (error) {
      const { data } = await api.get('/rehearsals');

      const rehearsalData = data.data || data;
      const actualTemplates = rehearsalData.filter((rehearsal: any) => {
        return (
          rehearsal.isTemplate === true &&
          rehearsal.title &&
          rehearsal.title.trim() !== ''
        );
      });

      const templates = actualTemplates.map((rehearsal: any) => ({
        id: rehearsal.id,
        title: rehearsal.title,
        type: rehearsal.type,
        duration: rehearsal.duration,
        objectives: rehearsal.objectives || '',
        rehearsalSongs: rehearsal.rehearsalSongs || [],
        category: rehearsal.category || 'General',
        tags: rehearsal.tags || [],
        estimatedAttendees: rehearsal.estimatedAttendees || 20,
        difficulty: rehearsal.difficulty || 'Easy',
        lastUsed: rehearsal.lastUsed ? new Date(rehearsal.lastUsed) : undefined,
        usageCount: rehearsal.usageCount || 0,
      }));

      return templates;
    }
  },

  createTemplate: async (
    templateData: Partial<RehearsalTemplate>,
  ): Promise<RehearsalTemplate> => {
    try {
      const response = await api.post('/rehearsals/templates', templateData);
      return response.data;
    } catch (error) {
      // Get current user from localStorage for default IDs
      let defaultUserId = 1;
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          defaultUserId = userData.id || 1;
        }
      } catch (er) {
        console.warn(
          'Could not parse user data for template creation, using default ID',
        );
      }

      const rehearsalData = {
        ...templateData,
        isTemplate: true,
        date: new Date().toISOString(),
        location: 'Template Location',
        rehearsalLeadId: defaultUserId,
        shiftLeadId: defaultUserId,
      };

      const response = await api.post('/rehearsals', rehearsalData);
      return {
        id: response.data.id,
        title: response.data.title,
        type: response.data.type,
        duration: response.data.duration,
        objectives: response.data.objectives || '',
        rehearsalSongs: response.data.rehearsalSongs || [],
        category: response.data.category || 'General',
        tags: response.data.tags || [],
        estimatedAttendees: response.data.estimatedAttendees || 20,
        difficulty: response.data.difficulty || 'Easy',
        lastUsed: undefined,
        usageCount: 0,
      };
    }
  },

  updateTemplate: async (
    id: number,
    templateData: Partial<RehearsalTemplate>,
  ): Promise<RehearsalTemplate> => {
    const response = await api.patch(
      `/rehearsals/templates/${id}`,
      templateData,
    );
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    try {
      await api.delete(`/rehearsals/templates/${id}`);
    } catch (error) {
      await api.patch(`/rehearsals/${id}`, { isTemplate: false });
    }
  },

  cleanupInvalidTemplates: async (): Promise<void> => {
    try {
      const { data } = await api.get('/rehearsals');
      const rehearsalData = data.data || data;

      const invalidTemplates = rehearsalData.filter((rehearsal: any) => {
        return (
          rehearsal.isTemplate === true &&
          (!rehearsal.title ||
            rehearsal.title.trim() === '' ||
            (!rehearsal.objectives &&
              (!rehearsal.rehearsalSongs ||
                rehearsal.rehearsalSongs.length === 0)))
        );
      });

      const cleanupPromises = invalidTemplates.map((rehearsal: Rehearsal) =>
        api
          .patch(`/rehearsals/${rehearsal.id}`, { isTemplate: false })
          .catch(() => {
            // Silently handle cleanup errors
          }),
      );

      await Promise.all(cleanupPromises);
    } catch (error) {
      // Silently handle cleanup errors
    }
  },

  copyTemplate: async (
    templateId: number,
    performanceId: number,
  ): Promise<Rehearsal> => {
    const response = await api.post(
      `/rehearsals/templates/${templateId}/copy`,
      { performanceId },
    );
    return response.data;
  },

  saveRehearsalAsTemplate: async (
    rehearsalId: number,
    templateData: Partial<RehearsalTemplate>,
  ): Promise<RehearsalTemplate> => {
    const response = await api.post(
      `/rehearsals/${rehearsalId}/save-as-template`,
      templateData,
    );
    return response.data;
  },

  fetchRehearsalsByPerformance: async (
    performanceId: number,
  ): Promise<Rehearsal[]> => {
    const { data } = await api.get(`/rehearsals/performance/${performanceId}`);
    return data;
  },

  markInProgress: async (id: number): Promise<Rehearsal> => {
    const response = await api.patch(`/rehearsals/${id}/mark-in-progress`);
    return response.data;
  },

  markCompleted: async (id: number): Promise<Rehearsal> => {
    const response = await api.patch(`/rehearsals/${id}/mark-completed`);
    return response.data;
  },

  markCancelled: async (id: number): Promise<Rehearsal> => {
    const response = await api.patch(`/rehearsals/${id}/mark-cancelled`);
    return response.data;
  },
};
