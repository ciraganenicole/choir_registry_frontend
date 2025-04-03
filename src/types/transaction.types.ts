export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  transactionDate: Date;
  contributor: {
    id: number;
    name: string;
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  contributorId?: number;
  startDate?: Date;
  endDate?: Date;
  timeFrame?: 'monthly' | 'quarterly' | 'yearly';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}
