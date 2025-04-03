import axios from 'axios';

import type {
  CreateTransactionDto,
  DailyContributionFilters,
  DailyContributionsResponse,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from '@/pages/transaction/types';

const API_URL = 'http://localhost:4000';

interface QueryParams extends TransactionFilters {
  page: number;
  limit: number;
}

export const TransactionService = {
  fetchTransactions: async (
    filters: TransactionFilters,
    pagination: { page: number; limit: number },
  ) => {
    // Create a copy of filters to avoid modifying the original
    const queryParams: QueryParams = {
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    };

    // Only include defined filters in the query
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key as keyof QueryParams] === undefined) {
        delete queryParams[key as keyof QueryParams];
      }
    });

    const { data } = await axios.get(`${API_URL}/transactions`, {
      params: queryParams,
    });
    return data;
  },

  createTransaction: async (
    data: CreateTransactionDto,
  ): Promise<Transaction> => {
    const response = await axios.post(`${API_URL}/transactions`, data);
    return response.data;
  },

  exportTransactions: async (filters: TransactionFilters): Promise<void> => {
    const response = await axios.get(`${API_URL}/transactions`, {
      params: {
        ...filters,
        limit: 1000000, // Get all records
      },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `transactions-${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  fetchStats: async (): Promise<TransactionStats> => {
    const { data } = await axios.get(`${API_URL}/transactions/stats`);
    return data;
  },

  fetchDailyContributions: async (
    filters: DailyContributionFilters,
    pagination: { page: number; limit: number },
  ) => {
    const { data } = await axios.get<DailyContributionsResponse>(
      `${API_URL}/transactions/daily`,
      {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        },
      },
    );
    return data;
  },
};
