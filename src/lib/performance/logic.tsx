import { useCallback, useEffect, useState } from 'react';

import { PerformanceService } from './service';
import type {
  CreatePerformanceDto,
  Performance,
  PerformanceFilterDto,
  PerformanceStats,
  PromotableRehearsal,
  PromotionResult,
  UpdatePerformanceDto,
} from './types';
import { PerformanceStatus, PerformanceType } from './types';

export const usePerformances = () => {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchPerformances = useCallback(
    async (filters: PerformanceFilterDto = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await PerformanceService.fetchPerformances(filters, {
          page,
          limit,
        });

        setPerformances(response.data);
        setTotal(response.total);
        setPagination({
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
          hasPrev: response.hasPrev,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch performances',
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  ); // ✅ FIXED: Removed 'filters' from dependencies since it's a parameter

  const createPerformance = useCallback(
    async (data: CreatePerformanceDto): Promise<Performance | null> => {
      setLoading(true);
      setError(null);

      try {
        const newPerformance = await PerformanceService.createPerformance(data);
        setPerformances((prev) => [newPerformance, ...prev]);
        return newPerformance;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create performance',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updatePerformance = useCallback(
    async (
      id: number,
      data: UpdatePerformanceDto,
    ): Promise<Performance | null> => {
      setLoading(true);
      setError(null);

      try {
        const updatedPerformance = await PerformanceService.updatePerformance(
          id,
          data,
        );
        setPerformances((prev) =>
          prev.map((perf) => (perf.id === id ? updatedPerformance : perf)),
        );
        return updatedPerformance;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update performance',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deletePerformance = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await PerformanceService.deletePerformance(id);
        setPerformances((prev) => prev.filter((perf) => perf.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete performance',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    performances,
    loading,
    error,
    total,
    page,
    setPage,
    pagination,
    fetchPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
  };
};

export const usePerformanceStats = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const performanceStats = await PerformanceService.fetchStats();
      setStats(performanceStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch performance stats',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  };
};

export const usePerformance = (id: number) => {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const performanceData = await PerformanceService.fetchPerformance(id);
      setPerformance(performanceData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch performance',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refreshPerformance: fetchPerformance,
  };
};

export const getPerformanceStatusColor = (status: PerformanceStatus) => {
  switch (status) {
    case PerformanceStatus.UPCOMING:
      return 'bg-blue-100 text-blue-800';
    case PerformanceStatus.IN_PREPARATION:
      return 'bg-yellow-100 text-yellow-800';
    case PerformanceStatus.READY:
      return 'bg-green-100 text-green-800';
    case PerformanceStatus.COMPLETED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPerformanceTypeColor = (type: string) => {
  switch (type) {
    case 'Concert':
      return 'bg-purple-100 text-purple-800';
    case 'Worship Service':
      return 'bg-indigo-100 text-indigo-800';
    case 'Sunday Service':
      return 'bg-blue-100 text-blue-800';
    case 'Special Event':
      return 'bg-pink-100 text-pink-800';
    case 'Rehearsal':
      return 'bg-green-100 text-green-800';
    case 'Wedding':
      return 'bg-red-100 text-red-800';
    case 'Funeral':
      return 'bg-gray-100 text-gray-800';
    case 'Other':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPerformanceStatusLabel = (status: PerformanceStatus) => {
  switch (status) {
    case PerformanceStatus.UPCOMING:
      return 'À venir';
    case PerformanceStatus.IN_PREPARATION:
      return 'En préparation';
    case PerformanceStatus.READY:
      return 'Prêt';
    case PerformanceStatus.COMPLETED:
      return 'Terminé';
    default:
      return status;
  }
};

export const getPerformanceTypeLabel = (type: PerformanceType) => {
  switch (type) {
    case PerformanceType.CONCERT:
      return 'Concert';
    case PerformanceType.WORSHIP_SERVICE:
      return 'Service de Culte';
    case PerformanceType.SUNDAY_SERVICE:
      return 'Service du Dimanche';
    case PerformanceType.SPECIAL_EVENT:
      return 'Événement Spécial';
    case PerformanceType.REHEARSAL:
      return 'Répétition';
    case PerformanceType.WEDDING:
      return 'Mariage';
    case PerformanceType.FUNERAL:
      return 'Funérailles';
    case PerformanceType.OTHER:
      return 'Autre';
    default:
      return type;
  }
};

export const usePromoteRehearsal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promoteRehearsal = useCallback(
    async (rehearsalId: number): Promise<Performance | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const promotedPerformance =
          await PerformanceService.promoteRehearsal(rehearsalId);

        return promotedPerformance;
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Failed to promote rehearsal to performance',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    promoteRehearsal,
    isLoading,
    error,
  };
};

export const useReplaceRehearsal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replaceRehearsal = useCallback(
    async (rehearsalId: number): Promise<Performance | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const performance =
          await PerformanceService.replaceRehearsal(rehearsalId);
        return performance;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to replace rehearsal';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    replaceRehearsal,
    isLoading,
    error,
  };
};

// ============================================================================
// Bulk Rehearsal Promotion Hooks
// ============================================================================

export const usePromotableRehearsals = () => {
  const [rehearsals, setRehearsals] = useState<PromotableRehearsal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotableRehearsals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await PerformanceService.getPromotableRehearsals();
      setRehearsals(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch promotable rehearsals',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotableRehearsals();
  }, [fetchPromotableRehearsals]);

  return {
    rehearsals,
    loading,
    error,
    refetch: fetchPromotableRehearsals,
  };
};

export const useBulkPromotion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromotionResult | null>(null);

  const promoteRehearsals = useCallback(
    async (rehearsalIds: number[]): Promise<PromotionResult | null> => {
      if (rehearsalIds.length === 0) return null;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const promotionResult =
          await PerformanceService.promoteRehearsals(rehearsalIds);
        setResult(promotionResult);
        return promotionResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to promote rehearsals';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    promoteRehearsals,
    isLoading,
    error,
    result,
    clearResult,
  };
};
