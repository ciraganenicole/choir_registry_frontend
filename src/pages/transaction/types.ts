export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum IncomeCategories {
  DAILY = 'DAILY',
  DONATION = 'DONATION',
  SPECIAL = 'SPECIAL',
  OTHER = 'OTHER',
}

export enum ExpenseCategories {
  CHARITY = 'CHARITY',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORT = 'TRANSPORT',
  SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
  COMMUNICATION = 'COMMUNICATION',
  RESTAURATION = 'RESTAURATION',
}

export const Subcategories = {
  CHARITY: {
    ILLNESS: 'ILLNESS',
    BIRTH: 'BIRTH',
    MARRIAGE: 'MARRIAGE',
    DEATH: 'DEATH',
  },
  MAINTENANCE: {
    MAINTENANCE: 'MAINTENANCE',
    BUY_DEVICES: 'BUY_DEVICES',
  },
  TRANSPORT: {
    COMMITTEE: 'COMMITTEE',
    SORTIE: 'SORTIE',
  },
} as const;

export type TransactionCategories = IncomeCategories | ExpenseCategories;

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: TransactionCategories;
  subcategory?: string;
  description?: string;
  transactionDate: string;
  contributor?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  externalContributorName?: string;
  externalContributorPhone?: string;
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  amountUSD?: number;
}

export enum Currency {
  USD = 'USD',
  FC = 'FC',
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  category?: TransactionCategories;
  subcategory?: string;
  description?: string;
  transactionDate: Date;
  contributorId?: number | null;
  externalContributorName?: string;
  externalContributorPhone?: string;
  currency: Currency;
  contributorType?: 'internal' | 'external';
}

export interface TransactionStats {
  usd: {
    totalIncome: number;
    totalExpense: number;
    netRevenue: number;
    currentMonthDailyTotal: number;
  };
  fc: {
    totalIncome: number;
    totalExpense: number;
    netRevenue: number;
    currentMonthDailyTotal: number;
  };
}

// Daily contribution specific types
export interface DailyContribution {
  date: string;
  amount: number;
  currency: Currency;
}

export interface DailyContributor {
  userId: number;
  firstName: string;
  lastName: string;
  totalAmount: number;
  contributions: DailyContribution[];
}

export interface DailyContributionsResponse {
  dates: string[];
  contributors: DailyContributor[];
  total: number;
}

export interface DailyContributionFilters {
  startDate?: string;
  endDate?: string;
  contributorId?: number;
  search?: string;
  timeFrame?: 'monthly' | 'quarterly' | 'yearly';
}

export interface DailyContributionSummary {
  userId: number;
  firstName: string;
  lastName: string;
  totalAmountUSD: number;
  totalAmountFC: number;
  contributionDates: string[];
  lastContribution: Date;
  frequency: number;
}

export interface DailyContributionResponse {
  data: DailyContributionSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface ContributorSummary {
  userId: number;
  firstName: string;
  lastName: string;
  totalAmount: number;
  contributionDates: string[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  subcategory?: string;
  type?: TransactionType;
  search?: string;
  contributorId?: number;
  externalContributorName?: string;
  externalContributorPhone?: string;
  currency?: Currency;
  minAmount?: number;
  maxAmount?: number;
}
