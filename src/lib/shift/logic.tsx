import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/config/api';
import type { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

export enum ShiftStatus {
  ACTIVE = 'Active',
  UPCOMING = 'Upcoming',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface LeadershipShift {
  id: number;
  name: string;
  leaderId: number;
  leader: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  startDate: string;
  endDate: string;
  status: ShiftStatus;
  eventsScheduled: number;
  eventsCompleted: number;
  notes?: string;
  createdById: number;
  created_by: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadershipShiftDto {
  name: string;
  leaderId: number;
  startDate: string;
  endDate: string;
  status: ShiftStatus;
  eventsScheduled?: number;
  eventsCompleted?: number;
  notes?: string;
}

export interface UpdateLeadershipShiftDto {
  name?: string;
  leaderId?: number;
  startDate?: string;
  endDate?: string;
  status?: ShiftStatus;
  eventsScheduled?: number;
  eventsCompleted?: number;
  notes?: string;
}

export interface LeadershipShiftFilterDto {
  search?: string;
  status?: ShiftStatus;
  leaderId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LeadershipShiftStats {
  totalShifts: number;
  activeShifts: number;
  upcomingShifts: number;
  completedShifts: number;
  currentLeader?: {
    id: number;
    name: string;
    email: string;
  };
  nextTransitionDays?: number;
  activeLeaders: number;
  byStatus: Record<ShiftStatus, number>;
  byMonth: Record<string, number>;
}

export interface LeaderHistory {
  leaderId: number;
  leaderName: string;
  leaderEmail: string;
  totalEvents: number;
  totalEventsCompleted: number;
}

export const canAccessShifts = (): boolean => {
  return true;
};

export const canCreateShifts = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

export const canUpdateShifts = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

export const canDeleteShifts = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

export const useShifts = (filters?: LeadershipShiftFilterDto) => {
  const [shifts, setShifts] = useState<LeadershipShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      // No need to check permissions here - role-based routing handles access control
      // Just like in the performance module

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.leaderId)
        params.append('leaderId', filters.leaderId.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/leadership-shifts?${params.toString()}`);
      setShifts(response.data[0]);
      setTotalCount(response.data[1]);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shifts');
      } else {
        setError(err.message || 'Failed to fetch shifts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchShifts();
    } else {
      setIsLoading(false);
    }
  }, [user, JSON.stringify(filters)]); // Use JSON.stringify to prevent infinite loops

  return { shifts, isLoading, error, totalCount, refetch: fetchShifts };
};

// Custom hook for filtered shifts to prevent infinite loops
export const useFilteredShifts = (
  baseFilters: LeadershipShiftFilterDto,
  showMyShifts: boolean,
  userId?: number,
) => {
  const stableFilters = useMemo(
    () => ({
      ...baseFilters,
      leaderId: showMyShifts && userId ? userId : undefined,
    }),
    [baseFilters, showMyShifts, userId],
  );

  return useShifts(stableFilters);
};

export const useCreateShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createShift = async (
    shiftData: CreateLeadershipShiftDto,
  ): Promise<LeadershipShift | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return null;
      }

      const hasAccess = canCreateShifts(user.role);
      if (!hasAccess) {
        setError('Insufficient permissions to create shifts');
        return null;
      }

      const response = await api.post('/leadership-shifts', shiftData);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to create shifts');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to create shift');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createShift, isLoading, error };
};

export const useUpdateShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateShift = async (
    id: number,
    shiftData: UpdateLeadershipShiftDto,
  ): Promise<LeadershipShift | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return null;
      }

      const hasAccess = canUpdateShifts(user.role);
      if (!hasAccess) {
        setError('Insufficient permissions to update shifts');
        return null;
      }

      const response = await api.patch(`/leadership-shifts/${id}`, shiftData);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to update shifts');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to update shift');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateShift, isLoading, error };
};

export const useDeleteShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteShift = async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return false;
      }

      const hasAccess = canDeleteShifts(user.role);
      if (!hasAccess) {
        setError('Insufficient permissions to delete shifts');
        return false;
      }

      await api.delete(`/leadership-shifts/${id}`);
      return true;
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to delete shifts');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to delete shift');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteShift, isLoading, error };
};

export const useShiftStats = () => {
  const [stats, setStats] = useState<LeadershipShiftStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      // No need to check permissions here - role-based routing handles access control

      const response = await api.get('/leadership-shifts/stats');
      setStats(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shift stats');
      } else {
        setError(err.message || 'Failed to fetch shift stats');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return { stats, isLoading, error, refetch: fetchStats };
};

export const useShiftById = (id: number) => {
  const [shift, setShift] = useState<LeadershipShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchShift = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      // No need to check permissions here - role-based routing handles access control

      const response = await api.get(`/leadership-shifts/${id}`);
      setShift(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shifts');
      } else if (err.response?.status === 404) {
        setError('Shift not found');
      } else {
        setError(err.message || 'Failed to fetch shift');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      fetchShift();
    } else {
      setIsLoading(false);
    }
  }, [id, user]);

  return { shift, isLoading, error, refetch: fetchShift };
};

export const useShiftValidation = (shifts?: LeadershipShift[]) => {
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    activeShifts: LeadershipShift[];
    currentShift: LeadershipShift | null;
    hasConflict: boolean;
    hasNoActive: boolean;
    count: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateShifts = useCallback((shiftsData: LeadershipShift[]) => {
    if (!shiftsData || !Array.isArray(shiftsData)) {
      return {
        isValid: false,
        activeShifts: [],
        currentShift: null as LeadershipShift | null,
        hasConflict: false,
        hasNoActive: true,
        count: 0,
      };
    }

    const activeShifts = shiftsData.filter(
      (shift) => shift.status === ShiftStatus.ACTIVE,
    );
    const currentShift: LeadershipShift | null =
      activeShifts.length > 0 ? activeShifts[0] || null : null;
    const hasConflict = activeShifts.length > 1;
    const hasNoActive = activeShifts.length === 0;
    const isValid = activeShifts.length <= 1;

    return {
      isValid,
      activeShifts,
      currentShift,
      hasConflict,
      hasNoActive,
      count: activeShifts.length,
    };
  }, []);

  useEffect(() => {
    if (shifts) {
      setIsLoading(true);
      try {
        const validation = validateShifts(shifts);
        setValidationStatus(validation);
        setError(null);
      } catch (err) {
        setError('Error validating shifts');
      } finally {
        setIsLoading(false);
      }
    }
  }, [shifts, validateShifts]);

  const validateSingleActiveShift = useCallback(async () => {
    if (!shifts) {
      setError('No shifts data available for validation');
      return null;
    }

    setIsLoading(true);
    try {
      const validation = validateShifts(shifts);
      setValidationStatus(validation);
      setError(null);
      return validation;
    } catch (err) {
      setError('Error validating shifts');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [shifts, validateShifts]);

  const resolveConflicts = useCallback(async () => {
    return { resolved: 0, conflicts: [] };
  }, []);

  const updateStatuses = useCallback(async () => {
    return { updated: 0, details: [] };
  }, []);

  return {
    validationStatus,
    isLoading,
    error,
    validateSingleActiveShift,
    resolveConflicts,
    updateStatuses,
    refetch: validateSingleActiveShift,
  };
};

export const useCurrentShift = () => {
  const [currentShift, setCurrentShift] = useState<LeadershipShift | null>(
    null,
  );
  const [allShifts, setAllShifts] = useState<LeadershipShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { validationStatus } = useShiftValidation(allShifts);

  const fetchCurrentShift = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      const shiftsResponse = await api.get('/leadership-shifts');
      const shifts = shiftsResponse.data[0] || [];
      setAllShifts(shifts);

      try {
        const response = await api.get('/leadership-shifts/current');
        setCurrentShift(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          try {
            const upcomingResponse = await api.get(
              '/leadership-shifts/upcoming?limit=1',
            );
            if (upcomingResponse.data && upcomingResponse.data.length > 0) {
              setCurrentShift(upcomingResponse.data[0]);
              return;
            }
          } catch (upcomingErr) {}
        }
        setCurrentShift(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shifts');
      } else {
        setError(err.message || 'Failed to fetch current shift');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurrentShift();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return {
    currentShift,
    isLoading,
    error,
    validationStatus,
    allShifts,
    refetch: fetchCurrentShift,
  };
};

export const useUpcomingShifts = (limit: number = 5) => {
  const [upcomingShifts, setUpcomingShifts] = useState<LeadershipShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUpcomingShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      const response = await api.get(
        `/leadership-shifts/upcoming?limit=${limit}`,
      );
      setUpcomingShifts(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shifts');
      } else {
        setError(err.message || 'Failed to fetch upcoming shifts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUpcomingShifts();
    } else {
      setIsLoading(false);
    }
  }, [user, limit]);

  return { upcomingShifts, isLoading, error, refetch: fetchUpcomingShifts };
};

export const useLeaderHistory = () => {
  const [leaderHistory, setLeaderHistory] = useState<LeaderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLeaderHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.role) {
        setError('Authentication required');
        return;
      }

      // First try to fetch from the dedicated history endpoint
      try {
        const response = await api.get('/leadership-shifts/history');

        // Handle different response structures
        let historyData: any[] = [];
        if (Array.isArray(response.data)) {
          historyData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          historyData = response.data.data;
        } else if (
          response.data?.history &&
          Array.isArray(response.data.history)
        ) {
          historyData = response.data.history;
        }

        // Validate and normalize the history data
        const validatedHistory = historyData
          .map((leader: any) => {
            // Handle both camelCase and snake_case field names
            const leaderId =
              leader.leaderId || leader.leader_id || leader.id || 0;
            const leaderName =
              leader.leaderName ||
              leader.leader_name ||
              leader.name ||
              `${leader.firstName || ''} ${leader.lastName || ''}`.trim() ||
              'Unknown Leader';
            const leaderEmail =
              leader.leaderEmail || leader.leader_email || leader.email || '';
            const totalEvents =
              leader.totalEvents ||
              leader.total_events ||
              leader.eventsScheduled ||
              leader.events_scheduled ||
              0;
            const totalEventsCompleted =
              leader.totalEventsCompleted ||
              leader.total_events_completed ||
              leader.eventsCompleted ||
              leader.events_completed ||
              0;

            return {
              leaderId: Number(leaderId) || 0,
              leaderName: String(leaderName) || 'Unknown Leader',
              leaderEmail: String(leaderEmail) || '',
              totalEvents: Number(totalEvents) || 0,
              totalEventsCompleted: Number(totalEventsCompleted) || 0,
            };
          })
          .filter(
            (leader) =>
              leader.leaderId > 0 &&
              (leader.totalEvents > 0 || leader.totalEventsCompleted > 0),
          );

        if (validatedHistory.length > 0) {
          setLeaderHistory(validatedHistory);
          return;
        }
      } catch (historyError: any) {
        // Fallback will be used
      }

      // Fallback: derive history from shifts data and actual performances
      try {
        const shiftsResponse = await api.get('/leadership-shifts?limit=1000');
        const allShifts: LeadershipShift[] = shiftsResponse.data[0] || [];

        // Also fetch performances to get actual completion data
        let performancesData: any[] = [];
        try {
          const performancesResponse = await api.get(
            '/performances?limit=10000',
          );
          if (Array.isArray(performancesResponse.data)) {
            performancesData = performancesResponse.data;
          } else if (Array.isArray(performancesResponse.data?.[0])) {
            performancesData = performancesResponse.data[0];
          }
        } catch (perfError) {
          // If performances endpoint fails, continue with shift data only
        }
        const historyMap = new Map<
          number,
          {
            leaderId: number;
            leaderName: string;
            leaderEmail: string;
            totalEvents: number;
            totalEventsCompleted: number;
            shiftCount: number;
          }
        >();

        // Count performances per leader from actual performance data
        // Note: shiftLeadId in performance corresponds to leaderId in shift
        const performancesByLeaderId = new Map<
          number,
          { total: number; completed: number }
        >();
        performancesData.forEach((performance: any) => {
          const shiftLeadId =
            performance.shiftLeadId ||
            performance.shift_lead_id ||
            performance.shiftLead?.id ||
            performance.leaderId ||
            performance.leader_id ||
            null;

          if (shiftLeadId) {
            const existing = performancesByLeaderId.get(shiftLeadId) || {
              total: 0,
              completed: 0,
            };
            existing.total += 1;
            const status =
              performance.status?.toLowerCase?.() || performance.status || '';
            if (status === 'completed') {
              existing.completed += 1;
            }
            performancesByLeaderId.set(shiftLeadId, existing);
          }
        });

        allShifts.forEach((shift) => {
          // Use shift.leaderId (which matches performance.shiftLeadId) or fall back to shift.leader.id
          const leaderId = shift.leaderId || shift.leader?.id;
          if (!leaderId) return;

          const existing = historyMap.get(leaderId);

          // Get actual performance counts if available
          // Match by shift.leaderId (which should match performance.shiftLeadId)
          const perfData = performancesByLeaderId.get(leaderId);
          const actualEvents = perfData?.total || 0;
          const actualCompleted = perfData?.completed || 0;

          // Prioritize actual performance data, but always have a fallback
          let eventsScheduled = 0;
          let eventsCompleted = 0;

          if (actualEvents > 0) {
            // Use actual performance data
            eventsScheduled = actualEvents;
            eventsCompleted = actualCompleted;
          } else if (shift.eventsScheduled && shift.eventsScheduled > 0) {
            // Fall back to shift data if available
            eventsScheduled = shift.eventsScheduled;
            eventsCompleted = shift.eventsCompleted || 0;
          } else {
            // Estimate based on shift duration
            const shiftStart = new Date(shift.startDate);
            const shiftEnd = new Date(shift.endDate);
            const shiftDurationDays = Math.ceil(
              (shiftEnd.getTime() - shiftStart.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            // Estimate: at least 1 event per week, minimum 1 event
            eventsScheduled = Math.max(1, Math.ceil(shiftDurationDays / 7));

            // Estimate completion based on status
            if (shift.status === ShiftStatus.COMPLETED) {
              eventsCompleted = eventsScheduled; // All completed if shift is completed
            } else if (shift.status === ShiftStatus.ACTIVE) {
              // For active shifts, estimate some completion based on elapsed time
              const now = new Date();
              const elapsedDays = Math.max(
                0,
                Math.ceil(
                  (now.getTime() - shiftStart.getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              );
              const progressRatio = Math.min(
                1,
                elapsedDays / shiftDurationDays,
              );
              eventsCompleted = Math.floor(
                eventsScheduled * progressRatio * 0.9,
              ); // 90% of progress
            } else {
              // For upcoming shifts, no events completed yet
              eventsCompleted = 0;
            }
          }

          // Ensure we always have at least 1 scheduled event for active/completed shifts
          if (
            eventsScheduled === 0 &&
            (shift.status === ShiftStatus.ACTIVE ||
              shift.status === ShiftStatus.COMPLETED)
          ) {
            eventsScheduled = 1;
            if (shift.status === ShiftStatus.COMPLETED) {
              eventsCompleted = 1;
            }
          }

          if (existing) {
            existing.totalEvents += eventsScheduled;
            existing.totalEventsCompleted += eventsCompleted;
            existing.shiftCount += 1;
          } else {
            historyMap.set(leaderId, {
              leaderId: shift.leader.id,
              leaderName:
                `${shift.leader.firstName || ''} ${shift.leader.lastName || ''}`.trim() ||
                'Unknown Leader',
              leaderEmail: shift.leader.email || '',
              totalEvents: eventsScheduled,
              totalEventsCompleted: eventsCompleted,
              shiftCount: 1,
            });
          }
        });

        const derivedHistory: LeaderHistory[] = Array.from(
          historyMap.values(),
        ).sort((a, b) => {
          if (b.totalEventsCompleted !== a.totalEventsCompleted) {
            return b.totalEventsCompleted - a.totalEventsCompleted;
          }
          return b.totalEvents - a.totalEvents;
        });

        setLeaderHistory(derivedHistory);
      } catch (fallbackError: any) {
        // If fallback also fails, set empty array
        setError(fallbackError.message || 'Failed to fetch leader history');
        setLeaderHistory([]);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access shift history');
      } else {
        setError(err.message || 'Failed to fetch leader history');
        setLeaderHistory([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaderHistory();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return { leaderHistory, isLoading, error, refetch: fetchLeaderHistory };
};

export const validateShiftForPerformance = (
  shifts: LeadershipShift[],
): {
  canProceed: boolean;
  warning?: string;
  currentShift?: LeadershipShift | null;
} => {
  const activeShifts = shifts.filter(
    (shift) => shift.status === ShiftStatus.ACTIVE,
  );
  const currentShift = activeShifts.length > 0 ? activeShifts[0] : null;

  if (activeShifts.length > 1) {
    return {
      canProceed: true,
      warning: `Multiple active shifts detected (${activeShifts.length}). Performance creation may not work correctly.`,
      currentShift,
    };
  }

  return {
    canProceed: true,
    currentShift,
  };
};

export const getLeadUsersCount = async (): Promise<number> => {
  try {
    const response = await api.get('/users', {
      params: {
        category: 'LEAD',
        page: 1,
        limit: 1,
      },
    });

    if (
      response.data &&
      typeof response.data === 'object' &&
      'total' in response.data
    ) {
      return response.data.total;
    }

    if (Array.isArray(response.data) && response.data.length === 2) {
      return response.data[1] || 0;
    }

    return 0;
  } catch (err) {
    return 0;
  }
};

export const useLeadUsersCount = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const leadCount = await getLeadUsersCount();
      setCount(leadCount);
    } catch (err) {
      setError('Failed to fetch LEAD users count');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  return { count, isLoading, error, refetch: fetchCount };
};

export const getShiftById = async (
  id: number,
): Promise<LeadershipShift | null> => {
  try {
    const response = await api.get(`/leadership-shifts/${id}`);
    return response.data;
  } catch (err) {
    return null;
  }
};

export const validateSingleActiveShift = (
  shifts: LeadershipShift[],
): { isValid: boolean; activeShifts: LeadershipShift[] } => {
  if (!shifts || !Array.isArray(shifts)) {
    return { isValid: false, activeShifts: [] };
  }

  const activeShifts = shifts.filter(
    (shift) => shift.status === ShiftStatus.ACTIVE,
  );
  const isValid = activeShifts.length <= 1;

  return { isValid, activeShifts };
};

export const resolveActiveShiftConflicts = (): {
  resolved: number;
  conflicts: any[];
} => {
  return { resolved: 0, conflicts: [] };
};

export const updateShiftStatuses = async (): Promise<{
  updated: number;
  details: any[];
}> => {
  try {
    const response = await api.post('/leadership-shifts/update-statuses');
    return response.data;
  } catch (err) {
    return { updated: 0, details: [] };
  }
};

export const searchShifts = (
  shifts: LeadershipShift[],
  searchTerm: string,
): LeadershipShift[] => {
  if (!searchTerm.trim()) return shifts;

  const term = searchTerm.toLowerCase();
  return shifts.filter(
    (shift) =>
      shift.name.toLowerCase().includes(term) ||
      shift.leader.firstName.toLowerCase().includes(term) ||
      shift.leader.lastName.toLowerCase().includes(term) ||
      shift.leader.email.toLowerCase().includes(term) ||
      shift.status.toLowerCase().includes(term),
  );
};

export const filterShifts = (
  shifts: LeadershipShift[],
  filters: Partial<LeadershipShiftFilterDto>,
): LeadershipShift[] => {
  return shifts.filter((shift) => {
    if (filters.status && shift.status !== filters.status) return false;
    if (filters.leaderId && shift.leaderId !== filters.leaderId) return false;
    if (
      filters.startDate &&
      new Date(shift.startDate) < new Date(filters.startDate)
    )
      return false;
    if (filters.endDate && new Date(shift.endDate) > new Date(filters.endDate))
      return false;
    return true;
  });
};

export const getStatusColor = (status: ShiftStatus): string => {
  switch (status) {
    case ShiftStatus.ACTIVE:
      return 'bg-green-100 text-green-800';
    case ShiftStatus.UPCOMING:
      return 'bg-blue-100 text-blue-800';
    case ShiftStatus.COMPLETED:
      return 'bg-gray-100 text-gray-800';
    case ShiftStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatShiftDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getShiftDuration = (
  startDate: string,
  endDate: string,
): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
};

export const getActualShiftStatus = (shift: LeadershipShift): ShiftStatus => {
  if (shift.status === ShiftStatus.CANCELLED) {
    return ShiftStatus.CANCELLED;
  }

  const now = new Date();
  const startDate = new Date(shift.startDate);
  const endDate = new Date(shift.endDate);

  if (now < startDate) {
    return ShiftStatus.UPCOMING;
  }
  if (now >= startDate && now <= endDate) {
    return ShiftStatus.ACTIVE;
  }
  return ShiftStatus.COMPLETED;
};

export const shiftValidationUtils = {
  hasSingleActiveShift: (shifts: LeadershipShift[]): boolean => {
    if (!shifts || !Array.isArray(shifts)) return false;
    const activeShifts = shifts.filter(
      (shift) => shift.status === ShiftStatus.ACTIVE,
    );
    return activeShifts.length === 1;
  },

  getActiveShifts: (shifts: LeadershipShift[]): LeadershipShift[] => {
    if (!shifts || !Array.isArray(shifts)) return [];
    return shifts.filter((shift) => shift.status === ShiftStatus.ACTIVE);
  },

  getCurrentActiveShift: (
    shifts: LeadershipShift[],
  ): LeadershipShift | null => {
    if (!shifts || !Array.isArray(shifts)) return null;
    const activeShifts = shifts.filter(
      (shift) => shift.status === ShiftStatus.ACTIVE,
    );
    return activeShifts.length > 0 ? activeShifts[0] || null : null;
  },

  hasConflicts: (shifts: LeadershipShift[]): boolean => {
    if (!shifts || !Array.isArray(shifts)) return false;
    const activeShifts = shifts.filter(
      (shift) => shift.status === ShiftStatus.ACTIVE,
    );
    return activeShifts.length > 1;
  },

  hasNoActiveShifts: (shifts: LeadershipShift[]): boolean => {
    if (!shifts || !Array.isArray(shifts)) return true;
    const activeShifts = shifts.filter(
      (shift) => shift.status === ShiftStatus.ACTIVE,
    );
    return activeShifts.length === 0;
  },
};

export const getShiftValidationMessage = (
  validation: { isValid: boolean; activeShifts: LeadershipShift[] } | null,
): string => {
  if (!validation) {
    return 'Shift validation status unknown';
  }

  if (validation.isValid) {
    return 'All shifts are properly configured';
  }
  return `Multiple active shifts detected (${validation.activeShifts.length}). Please contact an administrator.`;
};

export const getShiftValidationSeverity = (
  validation: { isValid: boolean; activeShifts: LeadershipShift[] } | null,
): 'success' | 'warning' | 'error' => {
  if (!validation) {
    return 'warning';
  }

  if (validation.isValid) {
    return 'success';
  }
  if (validation.activeShifts.length > 1) {
    return 'warning';
  }
  return 'error';
};

export const handleShiftValidationError = (
  error: any,
): { message: string; severity: 'warning' | 'error' } => {
  if (error.response?.status === 400) {
    return {
      message: 'Shift validation failed. Please check shift configuration.',
      severity: 'warning',
    };
  }
  if (error.response?.status === 403) {
    return {
      message: 'You do not have permission to validate shifts.',
      severity: 'error',
    };
  }
  if (error.response?.status === 500) {
    return {
      message: 'Server error during shift validation. Please try again.',
      severity: 'error',
    };
  }
  return {
    message: 'Unable to validate shifts. Please check your connection.',
    severity: 'warning',
  };
};
