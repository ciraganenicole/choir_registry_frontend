/* eslint-disable import/no-extraneous-dependencies */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { jsPDF as JSPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { api } from '@/config/api';

import { TransactionService } from './service';
import type {
  CreateTransactionDto,
  DailyContributionFilters,
  DailyContributionsResponse,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from './types';
import { Currency, TransactionType } from './types';

// Default conversion rate from FC to USD (1 USD = 2800 FC)
const DEFAULT_FC_TO_USD_RATE = 2800;

// Helper to determine transaction type
export const getTransactionType = (category: string): 'INCOME' | 'EXPENSE' => {
  const IncomeCategories = ['DAILY', 'SPECIAL', 'DONATION', 'OTHER'];
  return IncomeCategories.includes(category) ? 'INCOME' : 'EXPENSE';
};

// Error logging utility for development only
const logError = (error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
};

export const fetchTransactions = async (filters: TransactionFilters) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions?${queryParams.toString()}`);
    return response.data.map((transaction: Transaction) => ({
      ...transaction,
      type: getTransactionType(transaction.category),
      currency: transaction.currency as Currency,
    }));
  } catch (error) {
    logError(error);
    return [];
  }
};

const createTransaction = async (transaction: CreateTransactionDto) => {
  const { data } = await api.post('/transactions', transaction);
  return data;
};

// Custom hook to add a new transaction
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// Fetch transactions with filters and pagination
export const useTransactions = (
  filters: TransactionFilters,
  pagination: { page: number; limit: number },
) => {
  return useQuery({
    queryKey: ['transactions', filters, pagination],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());

      const { data } = await api.get(`/transactions?${queryParams.toString()}`);
      return data;
    },
    staleTime: 1000 * 60,
  });
};

// Create transaction mutation
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: TransactionService.createTransaction,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
    },
  });
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

// Export transactions
export const useExportTransactions = () => {
  return useMutation({
    mutationFn: async (params: {
      filters: TransactionFilters;
      exportAll?: boolean;
      conversionRate?: number;
    }) => {
      try {
        // Use provided conversion rate or default
        const conversionRate = params.conversionRate || DEFAULT_FC_TO_USD_RATE;

        const queryParams = new URLSearchParams();

        // Determine if we should export all based on filters
        const shouldExportAll =
          !params.filters.startDate &&
          !params.filters.endDate &&
          !params.filters.type &&
          !params.filters.category &&
          !params.filters.search;

        // Apply filters if not exporting all
        if (!shouldExportAll) {
          // Handle date filters first
          if (params.filters.startDate) {
            queryParams.append('startDate', params.filters.startDate);
          }
          if (params.filters.endDate) {
            queryParams.append('endDate', params.filters.endDate);
          }
          // Handle other filters
          if (params.filters.type) {
            queryParams.append('type', params.filters.type);
          }
          if (params.filters.category) {
            queryParams.append('category', params.filters.category);
          }
          if (params.filters.search) {
            queryParams.append('search', params.filters.search);
          }
        }

        // Add pagination parameters
        queryParams.append('page', '1');
        queryParams.append('limit', '999999');

        const transactionResponse = await api.get(
          `/transactions?${queryParams.toString()}`,
        );

        // Create PDF document with consistent margins
        const doc = new JSPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const margin = 15;

        try {
          const logoResponse = await fetch('/assets/images/Wlogo.png');
          const blob = await logoResponse.blob();
          const reader = new FileReader();

          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          doc.addImage(base64, 'PNG', 15, 15, 35, 20);
        } catch (error) {
          logError(error);
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(
          'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
          margin + 30,
          20,
        );
        doc.text('5è CELPA SALEM GOMA', margin + 30, 25);
        doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 30);

        doc.setFontSize(12);
        doc.text('TRANSACTIONS', margin, 40);

        let frenchDateHeader = '';
        if (shouldExportAll) {
          frenchDateHeader = `${format(parseISO(new Date().toISOString()), 'MM/yyyy', { locale: fr })}`;
        } else if (params.filters.startDate && params.filters.endDate) {
          frenchDateHeader = `Période : ${format(parseISO(params.filters.startDate), 'dd/MM/yyyy', { locale: fr })} à ${format(parseISO(params.filters.endDate), 'dd/MM/yyyy', { locale: fr })}`;
        }

        doc.setFontSize(10);
        doc.text(frenchDateHeader, margin, 45);

        const transactions = transactionResponse.data.data.map(
          (transaction: Transaction) => {
            let contributorName = 'Anonyme';
            if (transaction.contributor) {
              const firstName = transaction.contributor.firstName || '';
              const lastName = transaction.contributor.lastName || '';
              contributorName = `${lastName} ${firstName}`.trim() || 'Anonyme';
            } else if (transaction.externalContributorName) {
              contributorName =
                transaction.externalContributorName.trim() || 'Anonyme';
            }

            return [
              contributorName,
              transaction.type === TransactionType.INCOME
                ? 'Revenu'
                : 'Dépense',
              translateCategoryToFrench(transaction.category),
              transaction.subcategory
                ? translateCategoryToFrench(transaction.subcategory)
                : '-',
              transaction.amount.toFixed(2),
              transaction.currency === Currency.USD ? 'USD' : 'FC',
            ];
          },
        );

        const totalIncomeUSD = transactions
          .filter((t: string[]) => t[1] === 'Revenu' && t[5] === 'USD')
          .reduce(
            (sum: number, t: string[]) => sum + parseFloat(t[4] || '0'),
            0,
          );
        const totalIncomeFC = transactions
          .filter((t: string[]) => t[1] === 'Revenu' && t[5] === 'FC')
          .reduce(
            (sum: number, t: string[]) => sum + parseFloat(t[4] || '0'),
            0,
          );
        const totalExpenseUSD = transactions
          .filter((t: string[]) => t[1] === 'Dépense' && t[5] === 'USD')
          .reduce(
            (sum: number, t: string[]) => sum + parseFloat(t[4] || '0'),
            0,
          );
        const totalExpenseFC = transactions
          .filter((t: string[]) => t[1] === 'Dépense' && t[5] === 'FC')
          .reduce(
            (sum: number, t: string[]) => sum + parseFloat(t[4] || '0'),
            0,
          );

        // Convert FC to USD for totals using the provided conversion rate
        const totalIncomeFCInUSD = totalIncomeFC / conversionRate;
        const totalExpenseFCInUSD = totalExpenseFC / conversionRate;

        // Calculate total income and expense in USD
        const totalIncomeInUSD = totalIncomeUSD + totalIncomeFCInUSD;
        const totalExpenseInUSD = totalExpenseUSD + totalExpenseFCInUSD;

        autoTable(doc, {
          startY: 48,
          head: [
            [
              'Contributeur',
              'Type',
              'Catégorie',
              'Sous-catégorie',
              'Montant',
              'Devise',
            ],
          ],
          body: transactions,
          foot: [
            ['', '', '', 'REVENU TOTAL', `${totalIncomeUSD.toFixed(2)}`, '$'],
            ['', '', '', '', `${totalIncomeFC.toFixed(2)}`, 'FC'],
            ['', '', '', '', `${totalIncomeFCInUSD.toFixed(2)}`, '$'],
            [
              '',
              '',
              '',
              'DÉPENSE TOTALE',
              `${totalExpenseUSD.toFixed(2)}`,
              '$',
            ],
            ['', '', '', '', `${totalExpenseFC.toFixed(2)}`, 'FC'],
            ['', '', '', '', `${totalExpenseFCInUSD.toFixed(2)}`, '$'],
            [
              '',
              '',
              '',
              'SOLDE',
              `${(totalIncomeUSD - totalExpenseUSD).toFixed(2)}`,
              '$',
            ],
            [
              '',
              '',
              '',
              '',
              `${(totalIncomeFC - totalExpenseFC).toFixed(2)}`,
              'FC',
            ],
            [
              '',
              '',
              '',
              '',
              `${(totalIncomeInUSD - totalExpenseInUSD).toFixed(2)}`,
              '$',
            ],
            ['', '', '', 'Taux de conversion', `1$= ${conversionRate} FC`, ''],
          ],
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 0.5,
            lineColor: [0, 0, 0],
            lineWidth: 0,
            textColor: [0, 0, 0],
            halign: 'left',
          },
          headStyles: {
            fillColor: [43, 53, 68],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 9,
            cellPadding: 0.5,
            lineWidth: 0,
          },
          footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'normal',
            fontSize: 9,
            cellPadding: 0.5,
            lineWidth: 0,
            halign: 'right',
          },
          alternateRowStyles: {
            fillColor: [188, 188, 188],
            textColor: [0, 0, 0],
            halign: 'left',
          },
          columnStyles: {
            0: { cellWidth: 48, halign: 'left' },
            1: { cellWidth: 25, halign: 'left' },
            2: { cellWidth: 30, halign: 'left' },
            3: { cellWidth: 30, halign: 'left' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 20, halign: 'left' },
          },
          didParseCell: (hookData) => {
            const newStyles = { ...hookData.cell.styles };
            if (hookData.section === 'head') {
              // Right align the amount column header
              if (hookData.column.index === 4) {
                newStyles.halign = 'right';
              }
            } else if (hookData.section === 'foot') {
              // Right align all footer cells except the last row
              if (hookData.row.index < 9) {
                newStyles.halign = 'right';
              } else {
                newStyles.halign = 'left';
              }
              // Apply alternate row color for footer
              if (hookData.row.index % 2 === 1) {
                newStyles.fillColor = [91, 227, 248];
              }
              // Make SOLDE row bold (rows 6, 7, and 8)
              if (hookData.row.index >= 6 && hookData.row.index <= 8) {
                newStyles.fontStyle = 'bold';
              }
            } else {
              newStyles.textColor = [0, 0, 0];
              // Only set left alignment if it's not the amount column
              if (hookData.column.index !== 4) {
                newStyles.halign = 'left';
              }
            }
            Object.assign(hookData.cell.styles, newStyles);
          },
          margin: { top: 2, left: margin, bottom: margin, right: margin },
          showFoot: 'lastPage',
        });

        const filename = shouldExportAll
          ? `transactions_${format(parseISO(new Date().toISOString()), 'MMMM-d-yyyy').replace(/\//g, '-')}.pdf`
          : `transactions_${format(parseISO(params.filters.startDate ?? new Date().toISOString()), 'MMMM-d-yyyy')}_${format(parseISO(params.filters.endDate ?? new Date().toISOString()), 'MMMM-d-yyyy')}.pdf`;

        doc.save(filename);
      } catch (error) {
        logError(error);
        throw error;
      }
    },
  });
};

// Get daily contributions for a specific user
export function useDailyContributions(
  filters: DailyContributionFilters,
  pagination: { page: number; limit: number },
) {
  const query = useQuery<DailyContributionsResponse>({
    queryKey: ['daily-contributions', filters, pagination],
    queryFn: () =>
      TransactionService.fetchDailyContributions(filters, pagination),
    staleTime: 1000 * 60,
  });
  return query;
}

// Get transaction statistics
export const useTransactionStats = (filters?: TransactionFilters) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['transactionStats', filters],
    queryFn: async () => {
      try {
        const { data: responseData } = await api.get('/transactions/stats', {
          params: filters,
        });

        const stats: TransactionStats = {
          usd: {
            totalIncome: responseData.totals?.income?.usd || 0,
            totalExpense: responseData.totals?.expense?.usd || 0,
            netRevenue: responseData.totals?.solde?.usd || 0,
          },
          fc: {
            totalIncome: responseData.totals?.income?.fc || 0,
            totalExpense: responseData.totals?.expense?.fc || 0,
            netRevenue: responseData.totals?.solde?.fc || 0,
          },
          dailyTotalUSD: responseData.dailyTotalUSD || 0,
          dailyTotalFC: responseData.dailyTotalFC || 0,
        };
        console.log(responseData.totals?.fc || 0);

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        console.log(stats);
        return stats;
      } catch (error) {
        logError(error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
};

// Export transactions as PDF
export const useExportTransactionsPDF = () => {
  return useMutation({
    mutationFn: async (params: {
      filters: TransactionFilters;
      exportAll?: boolean;
      conversionRate?: number;
    }) => {
      try {
        // Determine if we should export all based on filters
        const shouldExportAll =
          !params.filters.startDate &&
          !params.filters.endDate &&
          !params.filters.type &&
          !params.filters.category &&
          !params.filters.search;

        // Skip date validation if exporting all transactions
        if (
          !shouldExportAll &&
          !params.filters.startDate &&
          !params.filters.endDate
        ) {
          throw new Error('At least one date must be specified for the report');
        }

        const queryParams = new URLSearchParams();

        // Apply filters if not exporting all
        if (!shouldExportAll) {
          // Handle date filters first
          if (params.filters.startDate) {
            queryParams.append('startDate', params.filters.startDate);
          }
          if (params.filters.endDate) {
            queryParams.append('endDate', params.filters.endDate);
          }
          // Handle other filters
          if (params.filters.type) {
            queryParams.append('type', params.filters.type);
          }
          if (params.filters.category) {
            queryParams.append('category', params.filters.category);
          }
          if (params.filters.search) {
            queryParams.append('search', params.filters.search);
          }
        }

        // Add pagination parameters to get all records
        queryParams.append('page', '1');
        queryParams.append('limit', '999999'); // Use a large number to get all records

        // Fetch the report data
        const { data: reportData } = await api.get('/transactions', {
          params: queryParams,
          responseType: 'blob',
          headers: {
            Accept: 'application/pdf',
          },
        });

        // Create and download the PDF file
        const blob = new Blob([reportData], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename based on date range or "all" if exporting everything
        const getDateRangeSuffix = () => {
          if (shouldExportAll) {
            return 'all';
          }

          if (params.filters.startDate && params.filters.endDate) {
            const start = format(
              parseISO(params.filters.startDate),
              'MMM d, yyyy',
            );
            const end = format(parseISO(params.filters.endDate), 'MMM d, yyyy');
            return `${start}_to_${end}`;
          }
          if (params.filters.startDate) {
            return format(parseISO(params.filters.startDate), 'MMM d, yyyy');
          }
          return 'all';
        };

        link.setAttribute(
          'download',
          `transaction-report-${getDateRangeSuffix()}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        logError(error);
        throw error;
      }
    },
  });
};
