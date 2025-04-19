import axios from 'axios';

import type {
  CreateTransactionDto,
  DailyContributionFilters,
  DailyContributionsResponse,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from './types';

const API_URL = 'https://choir-registry.onrender.com';

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

    // Only include defined and non-null filters in the query
    Object.keys(queryParams).forEach((key) => {
      if (
        queryParams[key as keyof QueryParams] === undefined ||
        queryParams[key as keyof QueryParams] === null
      ) {
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

  fetchStats: async (
    filters?: TransactionFilters,
  ): Promise<TransactionStats> => {
    const { data } = await axios.get(`${API_URL}/transactions/stats`, {
      params: filters,
    });

    return {
      usd: {
        totalIncome: Number(data.usd?.totalIncome || 0),
        totalExpense: Number(data.usd?.totalExpense || 0),
        netRevenue: Number(data.usd?.netRevenue || 0),
        currentMonthDailyTotal: Number(data.usd?.currentMonthDailyTotal || 0),
      },
      fc: {
        totalIncome: Number(data.fc?.totalIncome || 0),
        totalExpense: Number(data.fc?.totalExpense || 0),
        netRevenue: Number(data.fc?.netRevenue || 0),
        currentMonthDailyTotal: Number(data.fc?.currentMonthDailyTotal || 0),
      },
    };
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
