import React, { useState } from 'react';

import Pagination from '@/components/pagination';
import Popup from '@/components/popup';
import { useTransactions } from '@/lib/transaction/logic';
import type { Transaction } from '@/lib/transaction/types';
import {
  Currency,
  IncomeCategories,
  TransactionType,
} from '@/lib/transaction/types';
import type { User } from '@/lib/user/type';

interface UserContributionsDetailsProps {
  user: User;
  onClose: () => void;
}

interface TransactionFilterDto {
  startDate?: string;
  endDate?: string;
  category?: string;
}

// Translate category to French
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    // Income categories
    DAILY: 'Quotidien',
    SPECIAL: 'Spécial',
    DONATION: 'Donation',
    OTHER: 'Autre',
    // Subcategories
    ILLNESS: 'Maladie',
    BIRTH: 'Naissance',
    MARRIAGE: 'Mariage',
    DEATH: 'Décès',
    BUY_DEVICES: "Achat d'Équipements",
    COMMITTEE: 'Comité',
    SORTIE: 'Sortie',
  };
  return translations[category] || category;
};

const UserContributionsDetails: React.FC<UserContributionsDetailsProps> = ({
  user,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [filters, setFilters] = useState<TransactionFilterDto>({});

  // Use the transactions hook from logic.ts
  const { data: transactionData, error: queryError } = useTransactions({
    contributorId: user.id,
    type: TransactionType.INCOME,
    ...filters,
    page: 1,
    limit: 1000,
  });

  // Safely access the transactions data
  const transactions = transactionData?.data || [];
  const error = queryError || transactionData?.error;

  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const getCurrentRecords = () => {
    return transactions.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  // Calculate totals by currency
  const totalAmounts = transactions.reduce(
    (acc: { usd: number; fc: number }, transaction: Transaction) => {
      if (transaction.currency === Currency.USD) {
        acc.usd += transaction.amount;
      } else {
        acc.fc += transaction.amount;
      }
      return acc;
    },
    { usd: 0, fc: 0 },
  );

  const handleFilterChange = (newFilters: Partial<TransactionFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: Currency): string => {
    // For FC (Congolese Franc), we need to use CDF which is the ISO code
    const currencyCode = currency === Currency.FC ? 'CDF' : currency;

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Popup
      title={`Contributions - ${user.firstName}`}
      onClose={onClose}
      style="md:w-[80%] lg:w-[70%]"
    >
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
            <span className="text-lg font-medium text-white">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-gray-600">
              Historique des contributions financières
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Filtres de recherche
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Date de début
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.startDate || ''}
                onChange={(e) =>
                  handleFilterChange({ startDate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Date de fin
              </label>
              <input
                type="date"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.endDate || ''}
                onChange={(e) =>
                  handleFilterChange({ endDate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.category || ''}
                onChange={(e) =>
                  handleFilterChange({ category: e.target.value || undefined })
                }
              >
                <option value="">Toutes les catégories</option>
                {Object.values(IncomeCategories).map((category) => (
                  <option key={category} value={category}>
                    {translateCategory(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500 p-3">
                  <svg
                    className="size-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-700">
                    Total USD
                  </h3>
                  <p className="text-xs text-blue-600">
                    Contributions en dollars
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrency(totalAmounts.usd, Currency.USD)}
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  {
                    transactions.filter(
                      (t: Transaction) => t.currency === Currency.USD,
                    ).length
                  }{' '}
                  transaction
                  {transactions.filter(
                    (t: Transaction) => t.currency === Currency.USD,
                  ).length > 1
                    ? 's'
                    : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500 p-3">
                  <svg
                    className="size-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-700">
                    Total FC
                  </h3>
                  <p className="text-xs text-green-600">
                    Contributions en francs
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(totalAmounts.fc, Currency.FC)}
                </div>
                <div className="mt-1 text-xs text-green-600">
                  {
                    transactions.filter(
                      (t: Transaction) => t.currency === Currency.FC,
                    ).length
                  }{' '}
                  transaction
                  {transactions.filter(
                    (t: Transaction) => t.currency === Currency.FC,
                  ).length > 1
                    ? 's'
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <svg
                  className="size-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Erreur de chargement
                </h4>
                <p className="text-sm text-red-700">
                  Une erreur s&apos;est produite lors du chargement des données.
                  Veuillez réessayer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {transactionData?.isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-sm text-gray-500">
                Chargement des contributions...
              </p>
            </div>
          </div>
        )}

        {/* Mobile Transactions View */}
        {!transactionData?.isLoading && transactions?.length > 0 && (
          <div className="space-y-4 md:hidden">
            <h3 className="text-lg font-semibold text-gray-900">
              Historique des Contributions
            </h3>
            {getCurrentRecords().map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <svg
                        className="size-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Catégorie:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {translateCategory(transaction.category)}
                    </span>
                  </div>
                  {transaction.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Sous-catégorie:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {translateCategory(transaction.subcategory)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-6">
              <Pagination
                totalPages={Math.ceil(transactions.length / recordsPerPage)}
                currentPage={currentPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                }}
              />
            </div>
          </div>
        )}

        {/* Desktop Transactions Table */}
        {!transactionData?.isLoading && transactions?.length > 0 && (
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Historique des Contributions
                </h3>
                <p className="text-sm text-gray-600">
                  {transactions.length} contribution
                  {transactions.length > 1 ? 's' : ''} trouvée
                  {transactions.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Catégorie
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Sous-catégorie
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {getCurrentRecords().map((transaction: Transaction) => (
                      <tr
                        key={transaction.id}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 p-2">
                              <svg
                                className="size-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(transaction.transactionDate)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                            {translateCategory(transaction.category)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {transaction.subcategory
                              ? translateCategory(transaction.subcategory)
                              : '-'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency,
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                totalPages={Math.ceil(transactions.length / recordsPerPage)}
                currentPage={currentPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                }}
              />
            </div>
          </div>
        )}

        {/* No data state */}
        {!transactionData?.isLoading && transactions?.length === 0 && (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-100 p-6">
                <svg
                  className="size-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Aucune contribution
                </h3>
                <p className="text-sm text-gray-500">
                  Aucune contribution enregistrée pour cet utilisateur.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default UserContributionsDetails;
