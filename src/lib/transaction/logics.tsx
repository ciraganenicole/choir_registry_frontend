/* eslint-disable import/no-extraneous-dependencies */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    }) => {
      try {
        const queryParams = new URLSearchParams();

        if (!params.exportAll) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
              queryParams.append(key, value.toString());
            }
          });
        }

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
        doc.text('TRANSACTIONS', margin, 45);

        let frenchDateHeader = '';
        if (params.exportAll) {
          frenchDateHeader = `Toutes les Transactions - ${new Date().toLocaleDateString(
            'fr-FR',
            {
              year: 'numeric',
              month: 'long',
            },
          )}`;
        } else if (params.filters.startDate && params.filters.endDate) {
          frenchDateHeader = `Transactions du ${new Date(
            params.filters.startDate,
          ).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} au ${new Date(params.filters.endDate).toLocaleDateString(
            'fr-FR',
            {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            },
          )}`;
        }

        doc.setFontSize(10);
        doc.text(frenchDateHeader, margin, 52);

        const transactions = transactionResponse.data.data.map(
          (transaction: Transaction) => {
            let contributorName = 'Anonyme';
            if (transaction.contributor) {
              const firstName = transaction.contributor.firstName || '';
              const lastName = transaction.contributor.lastName || '';
              contributorName = `${firstName} ${lastName}`.trim() || 'Anonyme';
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

        autoTable(doc, {
          startY: 60,
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
            ['REVENU TOTAL', '', '', '', `${totalIncomeUSD.toFixed(2)}`, 'USD'],
            ['', '', '', '', `${totalIncomeFC.toFixed(2)}`, 'FC'],
            [
              'DÉPENSE TOTALE',
              '',
              '',
              '',
              `${totalExpenseUSD.toFixed(2)}`,
              'USD',
            ],
            ['', '', '', '', `${totalExpenseFC.toFixed(2)}`, 'FC'],
            [
              'SOLDE',
              '',
              '',
              '',
              `${(totalIncomeUSD - totalExpenseUSD).toFixed(2)}`,
              'USD',
            ],
            [
              '',
              '',
              '',
              '',
              `${(totalIncomeFC - totalExpenseFC).toFixed(2)}`,
              'FC',
            ],
          ],
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [43, 53, 68],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 15, halign: 'center' },
          },
          didParseCell: (hookData) => {
            const newStyles = { ...hookData.cell.styles };

            if (
              hookData.section === 'body' &&
              Array.isArray(hookData.row.raw)
            ) {
              const type = hookData.row.raw[1];
              if (type === 'Revenu') {
                newStyles.textColor = [0, 128, 0];
              } else if (type === 'Dépense') {
                newStyles.textColor = [255, 0, 0];
              }
            }

            Object.assign(hookData.cell.styles, newStyles);
          },
          margin: { top: margin, right: margin, bottom: margin, left: margin },
        });

        const filename = params.exportAll
          ? `transactions_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
          : `transactions_${params.filters.startDate || ''}_${params.filters.endDate || ''}.pdf`;

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

export const useExportDailyContributions = () => {
  return useMutation({
    mutationFn: async (filters: DailyContributionFilters) => {
      try {
        const response = await api.get('/transactions/daily', {
          params: {
            ...filters,
            limit: 999999,
          },
        });

        const { data } = response;
        const dates = data.dates || [];
        const contributors = data.contributors || [];

        // Create PDF document with consistent margins
        const doc = new JSPDF({
          orientation: 'landscape',
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
        doc.text('CONTRIBUTIONS QUOTIDIENNES', margin, 45);

        let frenchDateHeader = '';
        if (filters.startDate && filters.endDate) {
          frenchDateHeader = `Contributions du ${new Date(
            filters.startDate,
          ).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} au ${new Date(filters.endDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`;
        }

        doc.setFontSize(10);
        doc.text(frenchDateHeader, margin, 52);

        // Prepare table headers
        const headers = ['Prénom', 'Nom'];
        dates.forEach((date: string) => {
          headers.push(
            new Date(date).toLocaleDateString('fr-FR', {
              month: 'short',
              day: 'numeric',
            }),
          );
        });
        headers.push('Total');

        // Prepare table data
        const tableData = contributors.map((contributor: any) => {
          const rowData = [contributor.firstName, contributor.lastName];
          let contributorTotal = 0;

          dates.forEach((date: string) => {
            const contribution = contributor.contributions.find(
              (c: any) => c.date === date,
            );
            const amount = contribution?.amount || 0;
            contributorTotal += amount;
            rowData.push(amount ? amount.toFixed(2) : '-');
          });

          rowData.push(contributorTotal.toFixed(2));
          return rowData;
        });

        // Calculate totals for each date
        const dailyTotals = dates.map((date: string) => {
          return contributors.reduce((sum: number, contributor: any) => {
            const contribution = contributor.contributions.find(
              (c: any) => c.date === date,
            );
            return sum + (contribution?.amount || 0);
          }, 0);
        });

        // Calculate grand total
        const grandTotal = dailyTotals.reduce(
          (sum: number, total: number) => sum + total,
          0,
        );

        // Add totals row
        const totalsRow = [
          'Total',
          '',
          ...dailyTotals.map((t: number) => t.toFixed(2)),
          grandTotal.toFixed(2),
        ];

        autoTable(doc, {
          startY: 60,
          head: [headers],
          body: tableData,
          foot: [totalsRow],
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [43, 53, 68],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Prénom
            1: { cellWidth: 30 }, // Nom
            [headers.length - 1]: { cellWidth: 25 }, // Total column
          },
          didParseCell: (hookData) => {
            const newStyles = { ...hookData.cell.styles };

            // Center align all date columns
            if (
              hookData.column.index > 1 &&
              hookData.column.index < headers.length - 1
            ) {
              newStyles.halign = 'center';
            }

            // Right align the total column
            if (hookData.column.index === headers.length - 1) {
              newStyles.halign = 'right';
            }

            // Color the amounts in green (except in header and footer)
            if (hookData.section === 'body' && hookData.column.index > 1) {
              if (hookData.cell.raw !== '-') {
                newStyles.textColor = [0, 128, 0];
              }
            }

            Object.assign(hookData.cell.styles, newStyles);
          },
          margin: { top: margin, right: margin, bottom: margin, left: margin },
        });

        const filename = `contributions_quotidiennes_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
        doc.save(filename);
      } catch (error) {
        logError(error);
        throw error;
      }
    },
  });
};

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

        console.log('API /transactions/stats response:', responseData);

        const stats: TransactionStats = {
          usd: {
            totalIncome: Number(responseData.totals?.usd || 0),
            totalExpense: 0,
            netRevenue: 0,
            currentMonthDailyTotal: 0,
          },
          fc: {
            totalIncome: Number(responseData.totals?.fc || 0),
            totalExpense: 0,
            netRevenue: 0,
            currentMonthDailyTotal: 0,
          },
        };

        console.log('Mapped stats object:', stats);

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
    }) => {
      try {
        // Skip date validation if exporting all transactions
        if (
          !params.exportAll &&
          !params.filters.startDate &&
          !params.filters.endDate
        ) {
          throw new Error('At least one date must be specified for the report');
        }

        const queryParams = new URLSearchParams();

        // Only apply filters if not exporting all
        if (!params.exportAll) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
              queryParams.append(key, value.toString());
            }
          });
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
          if (params.exportAll) {
            return 'all';
          }

          if (params.filters.startDate && params.filters.endDate) {
            const start = new Date(params.filters.startDate).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              },
            );
            const end = new Date(params.filters.endDate).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              },
            );
            return `${start}_to_${end}`;
          }
          if (params.filters.startDate) {
            return new Date(params.filters.startDate).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
              },
            );
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
