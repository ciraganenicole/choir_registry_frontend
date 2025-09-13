import { useCallback, useEffect, useState } from 'react';

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

export const useUsers = (initialFilters?: UserFilters): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (filters: UserFilters = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const usersResponse = await FetchUsers({
          page: 1,
          limit: 100, // Reduced from 1000 to 100 for better performance
          ...initialFilters,
          ...filters,
        });
        setUsers(usersResponse.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    },
    [initialFilters],
  );

  useEffect(() => {
    fetchUsers();
  }, [initialFilters]); // ✅ FIXED: Depend on initialFilters directly instead of fetchUsers

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
