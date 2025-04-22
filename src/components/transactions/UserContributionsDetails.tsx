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
  const { data: transactionData, isLoading: loading } = useTransactions(
    {
      contributorId: user.id,
      type: TransactionType.INCOME,
      ...filters,
    },
    { page: 1, limit: 1000 },
  );

  const transactions = transactionData?.data || [];
  const error = transactionData?.error;

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
      style="md:w-[70%]"
    >
      <div className="flex flex-col gap-2">
        {/* Filters */}
        <div className="flex flex-wrap gap-1 md:gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Date de début
            </label>
            <input
              type="date"
              className="rounded-md border border-gray-300 p-1 text-xs md:px-3 md:py-2 md:text-sm"
              value={filters.startDate || ''}
              onChange={(e) =>
                handleFilterChange({ startDate: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Date de fin
            </label>
            <input
              type="date"
              className="rounded-md border border-gray-300 p-1 text-[10px] md:px-3 md:py-2 md:text-sm"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Catégorie
            </label>
            <select
              className="rounded-md border border-gray-300 p-1 text-xs md:px-3 md:py-2 md:text-sm"
              value={filters.category || ''}
              onChange={(e) =>
                handleFilterChange({ category: e.target.value || undefined })
              }
            >
              <option value="">Toutes</option>
              {Object.values(IncomeCategories).map((category) => (
                <option key={category} value={category}>
                  {translateCategory(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Amounts */}
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div className="rounded-md bg-blue-50 p-2 md:rounded-lg md:p-4">
            <p className="text-sm font-semibold text-blue-900 md:text-lg">
              Total en USD: {formatCurrency(totalAmounts.usd, Currency.USD)}
            </p>
          </div>
          <div className="rounded-md bg-green-50 p-2 md:rounded-lg md:p-4">
            <p className="text-sm font-semibold text-green-900 md:text-lg">
              Total en FC: {formatCurrency(totalAmounts.fc, Currency.FC)}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            Une erreur s&apos;est produite lors du chargement des données.
            Veuillez réessayer.
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        {!loading && transactions?.length > 0 && (
          <div className="mt-2 flex flex-col gap-3 md:hidden">
            <div className="flex flex-col gap-3 rounded-md border border-gray-500">
              {getCurrentRecords().map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-2 gap-2 border-b border-gray-500 p-2"
                >
                  <p className="text-sm">
                    {formatDate(transaction.transactionDate)}
                  </p>
                  <p className="text-sm">
                    {translateCategory(transaction.category)}
                  </p>
                  <p className="text-sm">
                    {transaction.subcategory
                      ? translateCategory(transaction.subcategory)
                      : '-'}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              ))}
            </div>
            <Pagination
              totalPages={Math.ceil(transactions.length / recordsPerPage)}
              currentPage={currentPage}
              onPageChange={(page) => {
                setCurrentPage(page);
              }}
            />
          </div>
        )}

        {/* Transactions table */}
        {!loading && transactions?.length > 0 && (
          <div className="hidden flex-col gap-3 md:flex">
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Catégorie
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sous-catégorie
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {getCurrentRecords().map((transaction: Transaction) => (
                    <tr key={transaction.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium">
                        {translateCategory(transaction.category)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {transaction.subcategory
                          ? translateCategory(transaction.subcategory)
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-green-600">
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="">
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
        {!loading && transactions?.length === 0 && (
          <div className="py-4 text-center text-gray-500">
            Aucune contribution enregistrée pour cet utilisateur.
          </div>
        )}
      </div>
    </Popup>
  );
};

export default UserContributionsDetails;
