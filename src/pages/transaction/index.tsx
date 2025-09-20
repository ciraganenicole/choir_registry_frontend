import { format, parseISO, startOfDay } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { FaEdit, FaPlus } from 'react-icons/fa';

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
import { canUpdateUsers } from '@/lib/user/permissions';
import { useAuth } from '@/providers/AuthProvider';

import Filters from '../../lib/transaction/filters';
import { CreateTransaction } from './create';
import UpdateTransaction from './update';

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

const getContributorName = (transaction: Transaction): string => {
  if (transaction.contributor) {
    const firstName = transaction.contributor.firstName || '';
    const lastName = transaction.contributor.lastName || '';
    const fullName = `${lastName} ${firstName}`.trim();
    return fullName || 'Anonyme';
  }

  if (transaction.externalContributorName) {
    return transaction.externalContributorName.trim() || 'Anonyme';
  }

  return 'Anonyme';
};

const Transactions = () => {
  const { user: currentUser } = useAuth();
  const [conversionRate, setConversionRate] = useState<number>(2800);
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
  const [pagination, setPagination] = useState({ page: 1, limit: 14 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [createModal, setCreateModal] = useState({
    type: TransactionType.INCOME,
  });

  // Queries and Mutations
  const { data, isLoading, refetch } = useTransactions(filters, pagination) as {
    data?: TransactionResponse;
    isLoading: boolean;
    refetch: () => void;
  };
  const createTransaction = useCreateTransaction();
  const exportTransactions = useExportTransactions();
  const exportTransactionsPDF = useExportTransactionsPDF();
  // Use the same filters for stats, but do NOT pass the type filter so we always get both totals
  const { data: stats, refetch: refetchStats } = useTransactionStats({
    startDate: filters.startDate,
    endDate: filters.endDate,
    // type: filters.type, // <-- removed so cards always show both totals
  });

  // Check for logical inconsistencies
  const hasLogicalInconsistency =
    stats &&
    (stats.dailyTotalUSD > stats.usd.totalIncome ||
      stats.dailyTotalFC > stats.fc.totalIncome);

  if (hasLogicalInconsistency) {
    console.warn('🚨 LOGICAL INCONSISTENCY DETECTED:');
    console.warn('Daily totals are greater than total income!');
    console.warn(
      'Daily USD:',
      stats.dailyTotalUSD,
      '> Total Income USD:',
      stats.usd.totalIncome,
    );
    console.warn(
      'Daily FC:',
      stats.dailyTotalFC,
      '> Total Income FC:',
      stats.fc.totalIncome,
    );
  }

  // Get total balance without any filters (complete balance) - currently not used
  // const { data: totalBalance } = useTotalBalance();

  const handleCreateTransaction = async (
    transactionData: CreateTransactionDto,
  ) => {
    try {
      await createTransaction.mutateAsync(transactionData);
      refetchStats(); // Refetch stats after creating a transaction
    } catch (error) {
      // Silently ignore transaction creation errors - UI will reflect current state
      console.warn('Failed to create transaction:', error);
    }
  };

  const handleExport = async (
    exportFormat: 'csv' | 'pdf',
    exportAll: boolean = false,
    exportConversionRate?: number,
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
          conversionRate: exportConversionRate,
        });
      } else {
        await exportTransactionsPDF.mutateAsync({
          filters: exportFilters,
          exportAll,
          conversionRate: exportConversionRate,
        });
      }
    } catch (error) {
      // Silently ignore export errors - user will be notified by the mutation
      console.warn('Failed to export transactions:', error);
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

      // Ensure dates are in yyyy-MM-dd format for API compatibility
      if (updated.startDate) {
        updated.startDate = format(new Date(updated.startDate), 'yyyy-MM-dd');
      }
      if (updated.endDate) {
        updated.endDate = format(new Date(updated.endDate), 'yyyy-MM-dd');
      }

      Object.keys(updated).forEach((key) => {
        if (updated[key as keyof TransactionFilters] === undefined) {
          delete updated[key as keyof TransactionFilters];
        }
      });

      return updated;
    });
  };

  const handleUpdate = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowUpdateModal(true);
  };

  const handleUpdateComplete = () => {
    setShowUpdateModal(false);
    setSelectedTransaction(null);
    refetch();
    refetchStats();
  };

  const formatCurrencyStats = (currencyStats: { USD: number; FC: number }) => {
    return (
      <div className="space-y-[1px] text-[18px] font-medium text-gray-800">
        <div className="text-[12px] md:text-[14px]">
          {currencyStats.USD.toFixed(0)} $
        </div>
        <div className="flex items-center gap-1 text-[12px] md:text-[14px]">
          {currencyStats.FC.toFixed(0)} FC
          <span className="text-xs text-gray-500">
            (~{(currencyStats.FC / conversionRate).toFixed(2)} $)
          </span>
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-sm text-gray-500">
                Chargement des transactions...
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (!data?.data?.length) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-gray-100 p-4">
                <svg
                  className="size-8 text-gray-400"
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
              <p className="text-sm text-gray-500">
                Aucune transaction trouvée
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return data.data.map((transaction: Transaction, index: number) => (
      <tr
        key={transaction.id}
        className="group transition-colors hover:bg-gray-50"
      >
        <td className="whitespace-nowrap px-6 py-4">
          <div className="flex items-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 group-hover:bg-gray-200">
              {index + 1}
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
              <span className="text-xs font-medium text-white">
                {getContributorName(transaction).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {getContributorName(transaction)}
              </div>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              transaction.type === TransactionType.INCOME
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <div
              className={`size-2 rounded-full ${
                transaction.type === TransactionType.INCOME
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            ></div>
            {transaction.type === TransactionType.INCOME ? 'Revenu' : 'Dépense'}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-900">
            {translateCategoryToFrench(transaction.category)}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-500">
            {transaction.subcategory
              ? translateCategoryToFrench(transaction.subcategory)
              : '-'}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div
            className={`text-sm font-semibold ${
              transaction.type === TransactionType.INCOME
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatAmount(transaction.amount)}{' '}
            <span className="text-xs text-gray-500">
              {transaction.currency === Currency.USD ? 'USD' : 'FC'}
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm text-gray-900">
            {format(parseISO(transaction.transactionDate), 'dd/MM/yyyy')}
          </div>
        </td>
        {canUpdateUsers(currentUser?.role) && (
          <td className="whitespace-nowrap px-6 py-4 text-center">
            <button
              onClick={() => handleUpdate(transaction)}
              className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
              title="Modifier"
            >
              <FaEdit className="size-4" />
            </button>
          </td>
        )}
      </tr>
    ));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:gap-4">
            <div>
              <h1 className="mt-6 text-xl font-bold text-gray-900 sm:text-4xl md:mt-0 md:text-3xl">
                Historique des Transactions
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <SearchInput onSearch={handleSearch} />
            </div>
          </div>
        </div>
        {/* Filters Section */}
        <div className="mb-6">
          <Filters
            onFilterChange={handleFilterChange}
            onExport={handleExport}
            currentFilters={filters}
            conversionRate={conversionRate}
            setConversionRate={setConversionRate}
          />
        </div>

        {/* Financial Overview Cards */}
        <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Income Card */}
          <Card className="group overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500 p-2 md:p-3">
                    <svg
                      className="size-4 text-white md:size-6"
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
                    <h3 className="text-sm font-medium text-green-700">
                      Revenus
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrencyStats({
                    USD: stats?.usd?.totalIncome || 0,
                    FC: stats?.fc?.totalIncome || 0,
                  })}
                </div>
                <button
                  onClick={() => handleAddTransaction(TransactionType.INCOME)}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-1.5 py-1 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 md:rounded-lg md:px-4 md:py-2"
                >
                  <FaPlus className="size-3 md:size-4" />
                  <span className="hidden sm:inline">Revenu</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Expense Card */}
          <Card className="group overflow-hidden border-0 bg-gradient-to-br from-red-50 to-red-100 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500 p-2 md:p-3">
                    <svg
                      className="size-4 text-white md:size-6"
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
                    <h3 className="text-sm font-medium text-red-700">
                      Dépenses
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-2xl font-bold text-red-800">
                  {formatCurrencyStats({
                    USD: stats?.usd?.totalExpense || 0,
                    FC: stats?.fc?.totalExpense || 0,
                  })}
                </div>
                <button
                  onClick={() => handleAddTransaction(TransactionType.EXPENSE)}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-1.5 py-1 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 md:rounded-lg md:px-4 md:py-2"
                >
                  <FaPlus className="size-3 md:size-4" />
                  <span className="hidden sm:inline">Dépense</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Balance Card */}
          <Card className="group overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500 p-2 md:p-3">
                    <svg
                      className="size-4 text-white md:size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-700">
                      Solde Net
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrencyStats({
                    USD:
                      (stats?.usd?.totalIncome || 0) -
                      (stats?.usd?.totalExpense || 0),
                    FC:
                      (stats?.fc?.totalIncome || 0) -
                      (stats?.fc?.totalExpense || 0),
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Income Card */}
          <Card className="group overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500 p-2 md:p-3">
                    <svg
                      className="size-4 text-white md:size-6"
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
                  <div>
                    <h3 className="text-sm font-medium text-orange-700">
                      Quotidiens
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrencyStats({
                    USD: stats?.dailyTotalUSD || 0,
                    FC: stats?.dailyTotalFC || 0,
                  })}
                </div>
                <div className="mt-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-1.5 py-1 text-xs font-medium text-white transition-colors hover:bg-orange-700 md:px-3 md:py-1.5"
                    href={'/transaction/daily'}
                  >
                    <svg
                      className="hidden size-3 sm:inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Voir <span className="hidden sm:inline">Détails</span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Contributeur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Sous-catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Montant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Date
                    </th>
                    {canUpdateUsers(currentUser?.role) && (
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 bg-white">
                  {renderTableContent()}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile Transactions View */}
        <div className="space-y-4 md:hidden">
          {(() => {
            if (isLoading) {
              return (
                <Card className="p-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-gray-500">
                      Chargement des transactions...
                    </p>
                  </div>
                </Card>
              );
            }

            if (!data?.data?.length) {
              return (
                <Card className="p-8">
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
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        Aucune transaction
                      </h3>
                      <p className="text-sm text-gray-500">
                        Aucune transaction trouvée pour cette période
                      </p>
                    </div>
                  </div>
                </Card>
              );
            }

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

              acc[contributorId]?.transactions.push(transaction);
              return acc;
            }, {});

            return Object.entries(groupedTransactions).map(
              ([userId, { name, transactions }]) => (
                <Card
                  key={userId}
                  className="overflow-hidden border-0 shadow-lg"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <span className="text-sm font-medium text-white">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {transactions.length} transaction
                          {transactions.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="px-6 py-2 transition-colors hover:bg-gray-50 md:py-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                  transaction.type === TransactionType.INCOME
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                <div
                                  className={`size-1.5 rounded-full ${
                                    transaction.type === TransactionType.INCOME
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}
                                ></div>
                                {transaction.type === TransactionType.INCOME
                                  ? 'Revenu'
                                  : 'Dépense'}
                              </span>
                            </div>
                            <div className="mb-1 text-sm font-medium text-gray-900">
                              {translateCategoryToFrench(transaction.category)}
                            </div>
                            {transaction.subcategory && (
                              <div className="mb-1 text-xs text-gray-500">
                                {translateCategoryToFrench(
                                  transaction.subcategory,
                                )}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {format(
                                parseISO(transaction.transactionDate),
                                'dd/MM/yyyy',
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-base font-bold md:text-lg ${
                                transaction.type === TransactionType.INCOME
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatAmount(transaction.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.currency === Currency.USD
                                ? 'USD'
                                : 'FC'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
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

        {showUpdateModal && selectedTransaction && (
          <UpdateTransaction
            transaction={selectedTransaction}
            onClose={() => {
              setShowUpdateModal(false);
              setSelectedTransaction(null);
            }}
            onUpdate={handleUpdateComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
