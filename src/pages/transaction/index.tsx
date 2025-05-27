import { format, parseISO, startOfDay } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import {
  useCreateTransaction,
  useExportTransactions,
  useExportTransactionsPDF,
  useTransactions,
  useTransactionStats,
} from '@/lib/transaction/logics';
import type {
  CreateTransactionDto,
  Transaction,
  TransactionFilters,
} from '@/lib/transaction/types';
import { Currency, TransactionType } from '@/lib/transaction/types';

import Filters from '../../lib/transaction/filters';
import { CreateTransaction } from './create';

interface TransactionResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

const formatAmount = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
};

// const formatChange = (change?: number) => {
//   if (change === undefined) return '0';
//   return `${change > 0 ? '+' : ''}${change.toFixed(2)}`;
// };

const formatCurrencyStats = (stats: { USD: number; FC: number }) => {
  return (
    <div className="space-y-[2px] text-[18px] font-medium text-gray-800">
      <div className="text-[12px] md:text-[18px]">{stats.USD.toFixed(2)} $</div>
      <div className="text-[12px] md:text-[18px]">{stats.FC.toFixed(2)} FC</div>
    </div>
  );
};

// Helper function to translate categories to French
const translateCategoryToFrench = (category: string): string => {
  const translations: Record<string, string> = {
    // Income categories
    DAILY: 'Quotidien',
    SPECIAL: 'Spécial',
    DONATION: 'Donation',
    OTHER: 'Autre',
    // Expense categories
    CHARITY: 'Charité',
    MAINTENANCE: 'Maintenance',
    TRANSPORT: 'Transport',
    SPECIAL_ASSISTANCE: 'Assistance Spéciale',
    COMMUNICATION: 'Communication',
    RESTAURATION: 'Restauration',
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

const logError = (error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
};

const getContributorName = (transaction: Transaction): string => {
  if (transaction.contributor) {
    const firstName = transaction.contributor.firstName || '';
    const lastName = transaction.contributor.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Anonyme';
  }

  if (transaction.externalContributorName) {
    return transaction.externalContributorName.trim() || 'Anonyme';
  }

  return 'Anonyme';
};

const Transactions = () => {
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: format(
      startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      'yyyy-MM-dd',
    ),
    endDate: format(
      startOfDay(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      ),
      'yyyy-MM-dd',
    ),
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 8 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModal, setCreateModal] = useState({
    type: TransactionType.INCOME,
  });

  // Queries and Mutations
  const { data, isLoading } = useTransactions(filters, pagination) as {
    data?: TransactionResponse;
    isLoading: boolean;
  };
  const createTransaction = useCreateTransaction();
  const exportTransactions = useExportTransactions();
  const exportTransactionsPDF = useExportTransactionsPDF();
  // Use the same filters for stats
  const { data: stats, refetch: refetchStats } = useTransactionStats({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const handleCreateTransaction = async (
    transactionData: CreateTransactionDto,
  ) => {
    try {
      await createTransaction.mutateAsync(transactionData);
      refetchStats(); // Refetch stats after creating a transaction
    } catch (error) {
      logError(error);
    }
  };

  const handleExport = async (
    exportFormat: 'csv' | 'pdf',
    exportAll: boolean = false,
  ) => {
    try {
      // Create a copy of filters without the type property
      const exportFilters = { ...filters };

      // If exporting all or no specific type is selected, remove the type filter
      if (exportAll || !filters.type) {
        delete exportFilters.type;
      }

      if (exportFormat === 'csv') {
        await exportTransactions.mutateAsync({
          filters: exportFilters,
          exportAll,
        });
      } else {
        await exportTransactionsPDF.mutateAsync({
          filters: exportFilters,
          exportAll,
        });
      }
    } catch (error) {
      logError(error);
    }
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAddTransaction = (type: TransactionType) => {
    setCreateModal({ type });
    setShowCreateModal(true);
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
      };

      // Convert date strings to Date objects for the API
      if (updated.startDate) {
        updated.startDate = new Date(updated.startDate).toISOString();
      }
      if (updated.endDate) {
        updated.endDate = new Date(updated.endDate).toISOString();
      }

      // Remove undefined values
      Object.keys(updated).forEach((key) => {
        if (updated[key as keyof TransactionFilters] === undefined) {
          delete updated[key as keyof TransactionFilters];
        }
      });

      return updated;
    });
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-4 text-center">
            Chargement des transactions...
          </td>
        </tr>
      );
    }

    if (!data?.data?.length) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-4 text-center">
            Aucune transaction trouvée
          </td>
        </tr>
      );
    }

    return data.data.map((transaction: Transaction, index: number) => (
      <tr
        key={transaction.id}
        className={`${
          transaction.type === TransactionType.INCOME
            ? 'bg-green-50'
            : 'bg-red-50'
        }`}
      >
        <td className="whitespace-nowrap px-3 py-4">{index + 1}</td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {getContributorName(transaction)}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div
            className={`text-sm font-medium ${
              transaction.type === TransactionType.INCOME
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {transaction.type === TransactionType.INCOME ? 'Revenu' : 'Dépense'}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-900">
            {translateCategoryToFrench(transaction.category)}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-900">
            {transaction.subcategory
              ? translateCategoryToFrench(transaction.subcategory)
              : '-'}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div
            className={`text-sm font-medium ${
              transaction.type === TransactionType.INCOME
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatAmount(transaction.amount)}{' '}
            {transaction.currency === Currency.USD ? '$' : 'FC'}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-900">
            {format(parseISO(transaction.transactionDate), 'dd/MM/yyyy')}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 md:mb-4">
          <h2 className="mr-2 text-[18px] font-semibold md:mr-0 md:text-2xl">
            Transactions
          </h2>
          <SearchInput onSearch={handleSearch} />
        </div>

        <Filters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          currentFilters={filters}
        />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <Card>
            <CardContent>
              <h3 className="font-regular mb-[4px] text-[12px] text-green-600 md:mb-[8px] md:text-[14px]">
                Revenu Total ({filters.startDate ? 'Période filtrée' : 'Tout'})
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-bold md:text-[24px]">
                  <p>
                    {formatCurrencyStats({
                      USD: stats?.usd?.totalIncome || 0,
                      FC: stats?.fc?.totalIncome || 0,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleAddTransaction(TransactionType.INCOME)}
                  className="rounded-full bg-green-500 p-2 text-white hover:bg-green-600"
                >
                  <FaPlus className="size-2 md:size-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-regular mb-[4px] text-[12px] text-red-600 md:mb-[8px] md:text-[14px]">
                Dépense Totale ({filters.startDate ? 'Période filtrée' : 'Tout'}
                )
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrencyStats({
                    USD: stats?.usd?.totalExpense || 0,
                    FC: stats?.fc?.totalExpense || 0,
                  })}
                </span>
                <button
                  onClick={() => handleAddTransaction(TransactionType.EXPENSE)}
                  className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                >
                  <FaPlus className="size-2 md:size-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-regular mb-[4px] text-[12px] text-blue-500 md:mb-[8px] md:text-[14px]">
                Solde ({filters.startDate ? 'Période filtrée' : 'Tout'})
              </h3>
              <span className="text-2xl font-bold">
                {formatCurrencyStats({
                  USD: stats?.usd?.netRevenue || 0,
                  FC: stats?.fc?.netRevenue || 0,
                })}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-[4px] flex flex-row items-center justify-between md:mb-[8px]">
                <h3 className="font-regular text-[12px] text-orange-500 md:text-[14px]">
                  Revenu Quotidien
                </h3>
                {/* <p className="md:text-md text-[10px] font-semibold text-gray-800">
                  {new Date().toLocaleString('fr-FR', { month: 'long' })}
                </p> */}
              </div>
              <div className="flex flex-row items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrencyStats({
                    USD: stats?.dailyTotalUSD || 0,
                    FC: stats?.dailyTotalFC || 0,
                  })}
                </span>
                <Link
                  className="rounded-sm bg-gray-900 p-1 text-[10px] font-medium text-white md:rounded-md md:px-3 md:py-1 md:text-[12px]"
                  href={'/transaction/daily'}
                >
                  Voir
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contributeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sous-catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 bg-white">
                {renderTableContent()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {(() => {
            if (isLoading) {
              return (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-gray-500">Chargement...</p>
                </div>
              );
            }

            if (!data?.data?.length) {
              return (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-gray-500">Aucune transaction trouvée</p>
                </div>
              );
            }

            // Group transactions by user
            const groupedTransactions = data.data.reduce<
              Record<string, { name: string; transactions: Transaction[] }>
            >((acc, transaction) => {
              const contributorId =
                transaction.contributor?.id?.toString() || 'anonymous';
              const contributorName = getContributorName(transaction);

              if (!acc[contributorId]) {
                acc[contributorId] = {
                  name: contributorName,
                  transactions: [],
                };
              }

              // Now TypeScript knows acc[contributorId] exists
              acc[contributorId]?.transactions.push(transaction);
              return acc;
            }, {});

            return Object.entries(groupedTransactions).map(
              ([userId, { name, transactions }]) => (
                <div key={userId} className="rounded-[10px] bg-white shadow">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                    <h3 className="text-[14px] font-medium text-gray-900">
                      {name}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-300">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`px-4 py-2 ${
                          transaction.type === TransactionType.INCOME
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="text-[12px] font-medium text-gray-900">
                              {translateCategoryToFrench(transaction.category)}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {format(
                                parseISO(transaction.transactionDate),
                                'dd/MM/yyyy',
                              )}
                            </div>
                          </div>
                          <div
                            className={`text-[12px] font-medium ${
                              transaction.type === TransactionType.INCOME
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatAmount(transaction.amount)}{' '}
                            {transaction.currency === Currency.USD ? '$' : 'FC'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            );
          })()}
        </div>

        <div className="mt-4">
          <Pagination
            totalPages={Math.ceil((data?.total || 0) / pagination.limit)}
            currentPage={pagination.page}
            onPageChange={handlePageChange}
          />
        </div>

        {showCreateModal && (
          <CreateTransaction
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTransaction}
            defaultType={createModal.type}
          />
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
