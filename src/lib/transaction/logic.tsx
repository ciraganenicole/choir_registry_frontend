import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../config/api';
import type { TransactionFilters, TransactionStats } from './types';

export const useTransactionStats = (filters?: TransactionFilters) => {
  const queryClient = useQueryClient();

  // const startDate = new Date().toISOString().split('T')[0]; // always use this format

  console.log('Sending filters to backend:', filters);

  return useQuery({
    queryKey: ['transactionStats', filters],
    queryFn: async () => {
      const { data: responseData } = await api.get('/transactions/stats', {
        params: filters,
      });

      console.log('API /transactions/stats response:', responseData);

      const stats: TransactionStats = {
        usd: {
          totalIncome: Number(responseData.totals?.usd || 0),
          totalExpense: 0,
          netRevenue: 0,
          currentMonthDailyTotal: 0,
        },
        fc: {
          totalIncome: Number(responseData.totals?.fc || 0),
          totalExpense: 0,
          netRevenue: 0,
          currentMonthDailyTotal: 0,
        },
      };

      console.log('Mapped stats object:', stats);

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
