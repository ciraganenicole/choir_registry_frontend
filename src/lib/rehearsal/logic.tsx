// ============================================================================
// REHEARSAL MODULE LOGIC
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

import { RehearsalService } from './service';
import type {
  CreateRehearsalDto,
  Rehearsal,
  RehearsalFilterDto,
  RehearsalSongsResponse,
  RehearsalStats,
  RehearsalTemplate,
} from './types';
import {
  InstrumentType,
  MusicalKey,
  RehearsalStatus,
  RehearsalType,
  SongDifficulty,
} from './types';

// ============================================================================
// REHEARSAL HOOKS
// ============================================================================

export const useRehearsals = (filters: RehearsalFilterDto = {}) => {
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Add debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchRehearsals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchRehearsals(filters);

      setRehearsals(response.data);
      setTotal(response.total);
      setPagination({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rehearsals');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]); // ✅ FIXED: Use JSON.stringify to prevent infinite loops

  // Auto-fetch when filters change (but not on every render)
  useEffect(() => {
    fetchRehearsals();
  }, [JSON.stringify(filters)]);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchRehearsals = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchRehearsals();
    }, 300); // 300ms debounce
  }, [fetchRehearsals]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    rehearsals,
    isLoading,
    error,
    total,
    pagination,
    fetchRehearsals, // Use the main fetch function
    refetch: fetchRehearsals, // Keep immediate fetch for manual refreshes
    debouncedFetch: debouncedFetchRehearsals, // For search/filter changes
  };
};

export const useRehearsalById = (id: number) => {
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRehearsal = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchRehearsal(id);
      setRehearsal(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rehearsal');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    rehearsal,
    isLoading,
    error,
    fetchRehearsal,
    refetch: fetchRehearsal,
  };
};

// Permission helper function for rehearsal creation
export const canCreateRehearsals = (
  userRole: UserRole,
  userCategories?: string[],
): boolean => {
  // Check if user has lead category (same as song permissions)
  if (userCategories?.includes('LEAD')) {
    return true;
  }

  // Also allow super admin and attendance admin roles
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ATTENDANCE_ADMIN ||
    userRole === UserRole.LEAD
  ) {
    return true;
  }

  return false;
};

export const useCreateRehearsal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const createRehearsal = useCallback(
    async (data: CreateRehearsalDto): Promise<Rehearsal | false> => {
      setIsLoading(true);
      setError(null);

      try {
        // Check authentication
        if (!isAuthenticated || !user) {
          setError('Authentication required');
          return false;
        }

        // Check permissions - LEAD is a category, not a role
        const hasAccess = canCreateRehearsals(user.role, user.categories);
        if (!hasAccess) {
          setError('Insufficient permissions to create rehearsals');
          return false;
        }

        const result = await RehearsalService.createRehearsal(data);
        return result;
      } catch (err: any) {
        console.error('Rehearsal creation error:', err);
        if (err.response?.status === 403) {
          setError(
            'Access denied: You do not have permission to create rehearsals. Please contact an administrator.',
          );
        } else if (err.response?.status === 401) {
          setError('Authentication required. Please log in again.');
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Failed to create rehearsal',
          );
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, isAuthenticated],
  );

  return {
    createRehearsal,
    isLoading,
    error,
  };
};

export const useUpdateRehearsal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRehearsal = useCallback(
    async (rehearsalId: number, updateData: any): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await RehearsalService.updateRehearsal(rehearsalId, updateData);
        return true;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update rehearsal');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    updateRehearsal,
    isLoading,
    error,
  };
};

export const useDeleteRehearsal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRehearsal = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await RehearsalService.deleteRehearsal(id);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete rehearsal');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteRehearsal,
    isLoading,
    error,
  };
};

export const useRehearsalStats = () => {
  const [stats, setStats] = useState<RehearsalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchStats();
      setStats(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch rehearsal stats',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    refetch: fetchStats,
  };
};

export const useRehearsalTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchTemplates();
      setTemplates(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch rehearsal templates',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copyTemplate = useCallback(
    async (templateId: number, performanceId: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await RehearsalService.copyTemplate(templateId, performanceId);
        return true;
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'Failed to copy rehearsal template',
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    copyTemplate,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getMusicalKeyOptions = () => {
  const options: {
    value: MusicalKey;
    label: string;
    category: 'Major' | 'Minor';
  }[] = [];

  Object.values(MusicalKey).forEach((key) => {
    options.push({
      value: key as MusicalKey,
      label: key,
      category: 'Major',
    });
  });

  return options.sort((a, b) => {
    const keyOrder = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    return keyOrder.indexOf(a.value) - keyOrder.indexOf(b.value);
  });
};

export const getInstrumentOptions = () => {
  const options: { value: InstrumentType; label: string }[] = [];

  Object.values(InstrumentType).forEach((instrument) => {
    options.push({
      value: instrument,
      label: instrument,
    });
  });

  return options;
};

export const getRehearsalTypeOptions = () => {
  return [
    { value: RehearsalType.GENERAL_PRACTICE, label: 'Pratique Générale' },
    {
      value: RehearsalType.PERFORMANCE_PREPARATION,
      label: 'Préparation de Performance',
    },
    { value: RehearsalType.SONG_LEARNING, label: 'Apprentissage de Chansons' },
    {
      value: RehearsalType.SECTIONAL_PRACTICE,
      label: 'Répétition par Section',
    },
    { value: RehearsalType.FULL_ENSEMBLE, label: 'Ensemble Complet' },
    { value: RehearsalType.DRESS_REHEARSAL, label: 'Répétition Générale' },
    { value: RehearsalType.OTHER, label: 'Autre' },
  ];
};

export const getRehearsalStatusOptions = () => {
  return Object.values(RehearsalStatus).map((status) => ({
    value: status,
    label: status,
  }));
};

export const getSongDifficultyOptions = () => {
  return [
    { value: SongDifficulty.EASY, label: 'Facile' },
    { value: SongDifficulty.INTERMEDIATE, label: 'Moyen' },
    { value: SongDifficulty.ADVANCED, label: 'Difficile' },
  ];
};

// ============================================================================
// STATUS HELPERS
// ============================================================================

export const getRehearsalStatusColor = (status: RehearsalStatus) => {
  switch (status) {
    case RehearsalStatus.PLANNING:
      return 'bg-blue-200 text-blue-800';
    case RehearsalStatus.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800';
    case RehearsalStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case RehearsalStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRehearsalTypeColor = (type: RehearsalType) => {
  switch (type) {
    case RehearsalType.GENERAL_PRACTICE:
      return 'bg-purple-100 text-purple-800';
    case RehearsalType.PERFORMANCE_PREPARATION:
      return 'bg-indigo-100 text-indigo-800';
    case RehearsalType.DRESS_REHEARSAL:
      return 'bg-pink-100 text-pink-800';
    case RehearsalType.SECTIONAL_PRACTICE:
      return 'bg-orange-100 text-orange-800';
    case RehearsalType.SONG_LEARNING:
      return 'bg-teal-100 text-teal-800';
    case RehearsalType.FULL_ENSEMBLE:
      return 'bg-cyan-100 text-cyan-800';
    case RehearsalType.OTHER:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getMusicalKeyColor = () => {
  return 'bg-blue-100 text-blue-800';
};

export const getDifficultyColor = (difficulty: SongDifficulty) => {
  switch (difficulty) {
    case SongDifficulty.EASY:
      return 'bg-green-100 text-blue-800';
    case SongDifficulty.INTERMEDIATE:
      return 'bg-yellow-100 text-yellow-800';
    case SongDifficulty.ADVANCED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const useTemplates = () => {
  const [templates, setTemplates] = useState<RehearsalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchTemplates();
      setTemplates(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    refetch: fetchTemplates,
  };
};

export const useCreateTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTemplate = useCallback(
    async (templateData: Partial<RehearsalTemplate>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await RehearsalService.createTemplate(templateData);
        return response;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to create template');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    createTemplate,
    isLoading,
    error,
  };
};

export const useUpdateTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTemplate = useCallback(
    async (id: number, templateData: Partial<RehearsalTemplate>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await RehearsalService.updateTemplate(
          id,
          templateData,
        );
        return response;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update template');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    updateTemplate,
    isLoading,
    error,
  };
};

export const useDeleteTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTemplate = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await RehearsalService.deleteTemplate(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete template');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteTemplate,
    isLoading,
    error,
  };
};

export const useCopyTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyTemplate = useCallback(
    async (templateId: number, performanceId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await RehearsalService.copyTemplate(
          templateId,
          performanceId,
        );
        return response;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to copy template');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    copyTemplate,
    isLoading,
    error,
  };
};

export const useSaveRehearsalAsTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAsTemplate = useCallback(
    async (rehearsalId: number, templateData: Partial<RehearsalTemplate>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await RehearsalService.saveRehearsalAsTemplate(
          rehearsalId,
          templateData,
        );
        return response;
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'Failed to save rehearsal as template',
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    saveAsTemplate,
    isLoading,
    error,
  };
};

export const useRehearsalSongs = (rehearsalId: number) => {
  const [rehearsalSongs, setRehearsalSongs] =
    useState<RehearsalSongsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRehearsalSongs = useCallback(async () => {
    if (!rehearsalId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await RehearsalService.fetchRehearsalSongs(rehearsalId);

      setRehearsalSongs(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch rehearsal songs',
      );
    } finally {
      setIsLoading(false);
    }
  }, [rehearsalId]);

  useEffect(() => {
    if (rehearsalId && rehearsalId > 0) {
      fetchRehearsalSongs();
    }
  }, [rehearsalId]);

  return {
    rehearsalSongs,
    isLoading,
    error,
    fetchRehearsalSongs,
    refetch: fetchRehearsalSongs,
  };
};
