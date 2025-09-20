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
    const response = await api.post('/rehearsals', data);
    return response.data;
  },

  updateRehearsal: async (
    id: number,
    data: UpdateRehearsalDto,
  ): Promise<Rehearsal> => {
    console.log('RehearsalService: updateRehearsal called with:', { id, data });
    const response = await api.patch(`/rehearsals/${id}`, data);
    console.log('RehearsalService: updateRehearsal response:', response.data);
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
    // Transform leadSingerIds to leadSingers format expected by backend
    const transformedSongData = {
      ...songData,
      leadSingers: songData.leadSingerIds?.map((id) => ({ id })) || [],
      leadSingerIds: undefined, // Remove the array field
    };

    console.log('API Call Debug:', {
      originalData: songData,
      transformedData: transformedSongData,
    });

    const response = await api.post(
      `/rehearsals/${rehearsalId}/songs`,
      transformedSongData,
    );
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
      const transformedSongData = {
        ...songData,
        leadSingers: songData.leadSingerIds?.map((id) => ({ id })) || [],
        leadSingerIds: undefined, // Remove the array field
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
        updateData.musicians = songData.musicians;
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
    await api.delete(`/rehearsals/${rehearsalId}/songs/${songId}`);
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
      const rehearsalData = {
        ...templateData,
        isTemplate: true,
        date: new Date().toISOString(),
        location: 'Template Location',
        rehearsalLeadId: 1, // Default lead
        shiftLeadId: 1, // Default shift lead
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
