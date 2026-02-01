import { useCallback, useEffect, useMemo, useState } from 'react';

import type { User, UserFilters } from './type';
import { FetchUsers } from './user_actions';

interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (filters?: UserFilters) => Promise<void>;
  getUserById: (id: number) => User | undefined;
  getUserName: (id: number) => string;
}

// Shared cache for users to avoid multiple API calls
interface CachedUsers {
  data: User[];
  filters: string; // Serialized filters for cache key
  timestamp: number;
}

const usersCache = new Map<string, CachedUsers>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map<string, Promise<User[]>>();

// Helper to serialize filters into a cache key
const getCacheKey = (filters?: UserFilters): string => {
  if (!filters || Object.keys(filters).length === 0) {
    return 'default';
  }
  return JSON.stringify(
    Object.keys(filters)
      .sort()
      .reduce(
        (acc, key) => {
          if (filters[key as keyof UserFilters] !== undefined) {
            acc[key] = filters[key as keyof UserFilters];
          }
          return acc;
        },
        {} as Record<string, any>,
      ),
  );
};

// Helper to check if cache is still valid
const isCacheValid = (cached: CachedUsers): boolean => {
  return Date.now() - cached.timestamp < CACHE_DURATION;
};

export const useUsers = (initialFilters?: UserFilters): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to avoid recreating on every render
  const memoizedFilters = useMemo(
    () => initialFilters,
    [initialFilters ? JSON.stringify(initialFilters) : undefined],
  );

  const cacheKey = useMemo(
    () => getCacheKey(memoizedFilters),
    [memoizedFilters],
  );

  const fetchUsers = useCallback(
    async (filters: UserFilters = {}) => {
      const finalFilters = { ...memoizedFilters, ...filters };
      const requestCacheKey = getCacheKey(finalFilters);

      // Check cache first
      const cached = usersCache.get(requestCacheKey);
      if (cached && isCacheValid(cached)) {
        setUsers(cached.data);
        return;
      }

      // Check if there's already a pending request for the same filters
      const pendingRequest = pendingRequests.get(requestCacheKey);
      if (pendingRequest) {
        try {
          const cachedUsers = await pendingRequest;
          setUsers(cachedUsers);
          return;
        } catch (err) {
          // If pending request fails, continue to make a new request
        }
      }

      setIsLoading(true);
      setError(null);

      // Create a promise for this request to share with other components
      const fetchPromise = (async () => {
        const usersResponse = await FetchUsers({
          page: 1,
          limit: finalFilters.limit || 100, // Use limit from filters, default to 100
          ...finalFilters,
        });
        const usersData = usersResponse.data || [];

        // Update cache
        usersCache.set(requestCacheKey, {
          data: usersData,
          filters: requestCacheKey,
          timestamp: Date.now(),
        });

        return usersData;
      })();

      // Store the pending request
      pendingRequests.set(requestCacheKey, fetchPromise);

      try {
        const usersData = await fetchPromise;
        setUsers(usersData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setIsLoading(false);
        // Remove from pending requests after completion
        pendingRequests.delete(requestCacheKey);
      }
    },
    [memoizedFilters],
  );

  // Initial fetch with cache check
  useEffect(() => {
    const cached = usersCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      setUsers(cached.data);
      setIsLoading(false);
      return;
    }

    // Only fetch if not already loading
    if (!isLoading) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const getUserById = useCallback(
    (id: number): User | undefined => {
      return users.find((user) => user.id === id);
    },
    [users],
  );

  const getUserName = useCallback(
    (id: number): string => {
      const user = getUserById(id);
      const result = user
        ? `${user.firstName} ${user.lastName}`
        : 'Utilisateur inconnu';

      return result;
    },
    [getUserById, users],
  );

  return { users, isLoading, error, fetchUsers, getUserById, getUserName };
};
