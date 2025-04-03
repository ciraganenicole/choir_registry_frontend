import Link from 'next/link';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';

import { CreateTransaction } from './create';
import Filters from './filters';
import {
  useCreateTransaction,
  useExportTransactions,
  useExportTransactionsPDF,
  useTransactions,
  useTransactionStats,
} from './logic';
import type {
  CreateTransactionDto,
  Transaction,
  TransactionFilters,
} from './types';
import { Currency, TransactionType } from './types';

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

const formatCurrencyStats = (amount: { USD: number; FC: number }) => {
  return (
    <div className="space-y-[2px] text-[18px] font-medium text-gray-800">
      <div className="">${amount.USD.toFixed(2)}</div>
      <div className="">{amount.FC.toFixed(2)} FC</div>
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

const Transactions = () => {
  const [filters, setFilters] = useState<TransactionFilters>({});
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
  const { data: stats } = useTransactionStats();

  const handleCreateTransaction = async (
    transactionData: CreateTransactionDto,
  ) => {
    try {
      await createTransaction.mutateAsync(transactionData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleExport = async (
    format: 'csv' | 'pdf',
    exportAll: boolean = false,
  ) => {
    try {
      // Create a copy of filters without the type property
      const exportFilters = { ...filters };

      // If exporting all or no specific type is selected, remove the type filter
      if (exportAll || !filters.type) {
        delete exportFilters.type;
      }

      if (format === 'csv') {
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
      console.error(`Error exporting transactions as ${format}:`, error);
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
            {transaction.contributor?.firstName
              ? `${transaction.contributor.firstName} ${transaction.contributor.lastName}`
              : transaction.externalContributorName || 'Anonyme'}
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
            {new Date(transaction.transactionDate).toLocaleDateString('fr-FR')}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between py-4">
          <h2 className="text-xl font-semibold md:text-2xl">Transactions</h2>
          <SearchInput onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <h3 className="font-regular mb-[8px] text-[14px] text-green-600">
                Revenu Total
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  {formatCurrencyStats(stats?.totalIncome || { USD: 0, FC: 0 })}
                </div>
                <button
                  onClick={() => handleAddTransaction(TransactionType.INCOME)}
                  className="rounded-full bg-green-500 p-2 text-white hover:bg-green-600"
                >
                  <FaPlus />
                </button>
              </div>
              {/* <p className="text-sm text-green-500">
                {formatChange(stats?.incomeChange)}% Par rapport au mois dernier
              </p> */}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-regular mb-[8px] text-[14px] text-red-600">
                Dépense Totale
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrencyStats(
                    stats?.totalExpenses || { USD: 0, FC: 0 },
                  )}
                </span>
                <button
                  onClick={() => handleAddTransaction(TransactionType.EXPENSE)}
                  className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                >
                  <FaPlus />
                </button>
              </div>
              {/* <p className="text-sm text-red-500">
                {formatChange(stats?.expenseChange)}% Par rapport au mois
                dernier
              </p> */}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-regular mb-[8px] text-[14px] text-blue-500">
                Revenu Net
              </h3>
              <span className="text-2xl font-bold">
                {formatCurrencyStats(stats?.totalRevenue || { USD: 0, FC: 0 })}
              </span>
              {/* <p className="text-sm text-blue-500">
                {formatChange(stats?.revenueChange)}% Par rapport au mois
                dernier
              </p> */}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-[8px] flex flex-row items-center justify-between">
                <h3 className="font-regular text-[14px] text-orange-500">
                  Revenu Quotidien
                </h3>
                <p className="text-md font-semibold text-gray-800">
                  {new Date().toLocaleString('fr-FR', { month: 'long' })}
                </p>
              </div>
              <div className="flex flex-row items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrencyStats(stats?.dailyIncome || { USD: 0, FC: 0 })}
                </span>
                <Link
                  className="rounded-md bg-gray-900 px-3 py-1 text-[12px] font-medium text-white"
                  href={'/transaction/daily'}
                >
                  Voir
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Filters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          currentFilters={filters}
        />

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
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
