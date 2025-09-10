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
          totalIncome: Number(responseData.totals?.usd || 0),
          totalExpense: 0,
          netRevenue: 0,
        },
        fc: {
          totalIncome: Number(responseData.totals?.fc || 0),
          totalExpense: 0,
          netRevenue: 0,
        },
        dailyTotalUSD: Number(responseData.dailyTotalUSD || 0),
        dailyTotalFC: Number(responseData.dailyTotalFC || 0),
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
      if (Array.isArray(data) && data.length === 2) {
        const [transactions, total] = data;
        return {
          data: transactions || [],
          total: total || 0,
          page: filters?.page || 1,
          limit: filters?.limit || 10,
        };
      }

      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
