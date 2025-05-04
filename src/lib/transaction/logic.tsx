import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../config/api';
import type { TransactionFilters, TransactionStats } from './types';

export const useTransactionStats = (filters?: TransactionFilters) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['transactionStats', filters],
    queryFn: async () => {
      const { data: responseData } = await api.get('/transactions/stats', {
        params: filters,
      });

      const stats: TransactionStats = {
        usd: {
          totalIncome: Number(responseData.usd?.totalIncome || 0),
          totalExpense: Number(responseData.usd?.totalExpense || 0),
          netRevenue: Number(responseData.usd?.netRevenue || 0),
          currentMonthDailyTotal: Number(
            responseData.usd?.currentMonthDailyTotal || 0,
          ),
        },
        fc: {
          totalIncome: Number(responseData.fc?.totalIncome || 0),
          totalExpense: Number(responseData.fc?.totalExpense || 0),
          netRevenue: Number(responseData.fc?.netRevenue || 0),
          currentMonthDailyTotal: Number(
            responseData.fc?.currentMonthDailyTotal || 0,
          ),
        },
      };

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      return stats;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
};

export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const { data } = await api.get('/transactions', {
        params: filters,
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
