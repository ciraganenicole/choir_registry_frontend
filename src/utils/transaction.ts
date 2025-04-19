// utils/transaction-utils.ts

import type { Transaction } from '@/lib/transaction/types';

export enum TransactionCategories {
  DAILY = 'DAILY',
  SPECIAL = 'SPECIAL',
  DONATION = 'DONATION',
  OTHER = 'OTHER',
  CHARITY = 'CHARITY',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORT = 'TRANSPORT',
  SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
  COMMUNICATION = 'COMMUNICATION',
  RESTAURATION = 'RESTAURATION',
}

// Define which categories are income and which are expenses
export const IncomeCategories = [
  TransactionCategories.DAILY,
  TransactionCategories.SPECIAL,
  TransactionCategories.DONATION,
  TransactionCategories.OTHER,
];

export const ExpenseCategories = [
  TransactionCategories.CHARITY,
  TransactionCategories.MAINTENANCE,
  TransactionCategories.TRANSPORT,
  TransactionCategories.SPECIAL_ASSISTANCE,
  TransactionCategories.COMMUNICATION,
  TransactionCategories.RESTAURATION,
];

// Helper function to check if a category is income
export const isIncome = (category: TransactionCategories): boolean =>
  IncomeCategories.includes(category);

// Helper function to check if a category is expense
export const isExpense = (category: TransactionCategories): boolean =>
  ExpenseCategories.includes(category);

// export const sorttransactions = (transactions: Transaction[]): transaction[] => {
//   return [...transactions].sort((a, b) => {
//     const nameA = a.name.toLowerCase();
//     const nameB = b.name.toLowerCase();
//     if (nameA < nameB) return -1;
//     if (nameA > nameB) return 1;
//     return 0;
//   });
// };

export const filterTransactions = (
  transactions: Transaction[],
  searchQuery: string,
): Transaction[] => {
  const lowerCaseQuery = searchQuery.toLowerCase();
  return transactions.filter((transaction) => {
    // Get contributor name or external contributor name
    const contributorName = transaction.contributor
      ? `${transaction.contributor.firstName} ${transaction.contributor.lastName}`.toLowerCase()
      : transaction.externalContributorName?.toLowerCase() || '';

    return [contributorName, transaction.amount.toString()].some((field) =>
      field.includes(lowerCaseQuery),
    );
  });
};
