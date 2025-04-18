/* eslint-disable import/no-extraneous-dependencies */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExcelJS from 'exceljs';

import { TransactionService } from './service';
import type {
  CreateTransactionDto,
  DailyContribution,
  DailyContributionFilters,
  DailyContributor,
  Transaction,
  TransactionFilters,
} from './types';
import { Currency, TransactionType } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper to determine transaction type
export const getTransactionType = (category: string): 'INCOME' | 'EXPENSE' => {
  const IncomeCategories = ['DAILY', 'SPECIAL', 'DONATION', 'OTHER'];

  return IncomeCategories.includes(category) ? 'INCOME' : 'EXPENSE';
};

export const fetchTransactions = async (filters: TransactionFilters) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await axios.get(
      `${API_URL}/transactions?${queryParams.toString()}`,
    );
    return response.data.map((transaction: Transaction) => ({
      ...transaction,
      type: getTransactionType(transaction.category),
      currency: transaction.currency as Currency,
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

const createTransaction = async (transaction: CreateTransactionDto) => {
  const { data } = await axios.post(`${API_URL}/transactions`, transaction);
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
    queryFn: () => TransactionService.fetchTransactions(filters, pagination),
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

        const response = await axios.get(
          `${API_URL}/transactions?${queryParams.toString()}`,
        );

        // Create date range header text
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

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transactions');

        // Add organization header
        worksheet.mergeCells('A1:G1');
        const orgCell = worksheet.getCell('A1');
        orgCell.value = 'REGISTRE DE CHORALE';
        orgCell.font = {
          name: 'Arial',
          size: 16,
          bold: true,
          color: { argb: '000000' },
        };
        orgCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(1).height = 30;

        // Add report title with date range in French
        worksheet.mergeCells('A2:G2');
        const titleCell = worksheet.getCell('A2');
        titleCell.value = frenchDateHeader;
        titleCell.font = {
          name: 'Arial',
          size: 14,
          bold: true,
          color: { argb: '000000' },
        };
        titleCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(2).height = 25;

        // Add empty row for spacing
        worksheet.addRow([]);

        // Set column widths
        worksheet.columns = [
          { key: 'contributor', width: 30 },
          { key: 'type', width: 15 },
          { key: 'category', width: 20 },
          { key: 'subcategory', width: 20 },
          { key: 'amount', width: 15 },
          { key: 'currency', width: 10 },
          { key: 'date', width: 15 },
        ];

        // Add header row
        const headerRow = worksheet.addRow([
          'Contributeur',
          'Type',
          'Catégorie',
          'Sous-catégorie',
          'Montant',
          'Devise',
          'Date',
        ]);

        // Style header row
        const styleHeaderCell = (cell: ExcelJS.Cell) => {
          // eslint-disable-next-line no-param-reassign
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2B3544' },
          } as ExcelJS.Fill;

          // eslint-disable-next-line no-param-reassign
          cell.font = {
            bold: true,
            color: { argb: 'FFFFFF' },
            name: 'Arial',
            size: 12,
          } as ExcelJS.Font;

          // eslint-disable-next-line no-param-reassign
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          } as ExcelJS.Alignment;

          // eslint-disable-next-line no-param-reassign
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          } as ExcelJS.Borders;
        };

        headerRow.height = 25;
        headerRow.eachCell(styleHeaderCell);

        // Process transaction data
        const transactions = response.data.data.map(
          (transaction: Transaction) => {
            // Get full contributor name with proper handling
            let contributorName = 'Anonyme';
            if (transaction.contributor) {
              const firstName = transaction.contributor.firstName || '';
              const lastName = transaction.contributor.lastName || '';
              contributorName = `${firstName} ${lastName}`.trim() || 'Anonyme';
            } else if (transaction.externalContributorName) {
              contributorName =
                transaction.externalContributorName.trim() || 'Anonyme';
            }

            return {
              contributor: contributorName,
              type:
                transaction.type === TransactionType.INCOME
                  ? 'Revenu'
                  : 'Dépense',
              category: translateCategoryToFrench(transaction.category),
              subcategory: transaction.subcategory
                ? translateCategoryToFrench(transaction.subcategory)
                : '-',
              amount: transaction.amount.toFixed(2),
              currency: transaction.currency === Currency.USD ? '$' : 'FC',
              date: new Date(transaction.transactionDate).toLocaleDateString(
                'fr-FR',
              ),
            };
          },
        );

        // Add data with alternating row colors
        transactions.forEach((transaction: any, index: number) => {
          const row = worksheet.addRow([
            transaction.contributor,
            transaction.type,
            transaction.category,
            transaction.subcategory,
            transaction.amount,
            transaction.currency,
            transaction.date,
          ]);

          // Style data row
          const styleDataCell = (
            cell: ExcelJS.Cell,
            colNumber: number,
            rowIndex: number,
          ) => {
            // eslint-disable-next-line no-param-reassign
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: rowIndex % 2 === 0 ? 'F3F4F6' : 'FFFFFF',
              },
            } as ExcelJS.Fill;

            // eslint-disable-next-line no-param-reassign
            cell.alignment = {
              horizontal: colNumber <= 2 ? 'left' : 'center',
              vertical: 'middle',
            } as ExcelJS.Alignment;

            // eslint-disable-next-line no-param-reassign
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            } as ExcelJS.Borders;

            // Format amount columns with proper number formatting
            if (colNumber > 2) {
              // eslint-disable-next-line no-param-reassign
              cell.value = Number(cell.value);
              // eslint-disable-next-line no-param-reassign
              cell.numFmt = '"$"#,##0.00';
              // eslint-disable-next-line no-param-reassign
              cell.font = {
                color: { argb: '008000' },
                bold: true,
              } as ExcelJS.Font;
            }
          };

          row.eachCell((cell, colNumber) =>
            styleDataCell(cell, colNumber, index),
          );
        });

        // Add summary section
        worksheet.addRow([]); // Empty row for spacing
        const summaryStartRow = worksheet.rowCount + 1;

        // Add summary headers
        worksheet.mergeCells(`A${summaryStartRow}:G${summaryStartRow}`);
        const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitleCell.value = 'RÉSUMÉ';
        // eslint-disable-next-line no-param-reassign
        summaryTitleCell.font = {
          bold: true,
          size: 12,
          color: { argb: 'FFFFFF' },
        } as ExcelJS.Font;
        // eslint-disable-next-line no-param-reassign
        summaryTitleCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        } as ExcelJS.Alignment;
        // eslint-disable-next-line no-param-reassign
        summaryTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2B3544' },
        } as ExcelJS.Fill;

        // Calculate totals
        const totalIncomeUSD = transactions
          .filter((t: any) => t.type === 'Revenu' && t.currency === '$')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        const totalIncomeFC = transactions
          .filter((t: any) => t.type === 'Revenu' && t.currency === 'FC')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        const totalExpenseUSD = transactions
          .filter((t: any) => t.type === 'Dépense' && t.currency === '$')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        const totalExpenseFC = transactions
          .filter((t: any) => t.type === 'Dépense' && t.currency === 'FC')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

        // Add summary data
        const summaryData = [
          [
            'REVENU TOTAL',
            `${totalIncomeUSD.toFixed(2)} USD`,
            `${totalIncomeFC.toFixed(2)} FC`,
          ],
          [
            'DÉPENSE TOTALE',
            `${totalExpenseUSD.toFixed(2)} USD`,
            `${totalExpenseFC.toFixed(2)} FC`,
          ],
          [
            'SOLDE',
            `${(totalIncomeUSD - totalExpenseUSD).toFixed(2)} USD`,
            `${(totalIncomeFC - totalExpenseFC).toFixed(2)} FC`,
          ],
        ];

        const styleSummaryCell = (cell: ExcelJS.Cell, textColor: string) => {
          // eslint-disable-next-line no-param-reassign
          cell.font = {
            bold: true,
            color: { argb: textColor },
          } as ExcelJS.Font;
          // eslint-disable-next-line no-param-reassign
          cell.alignment = {
            horizontal: 'center',
          } as ExcelJS.Alignment;
          // eslint-disable-next-line no-param-reassign
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          } as ExcelJS.Borders;
        };

        // Replace nested ternary with a function
        const getTextColor = (index: number): string => {
          if (index === 0) return '008000';
          if (index === 1) return 'FF0000';
          return '0000FF';
        };

        summaryData.forEach((row, index) => {
          const summaryRow = worksheet.addRow(row);
          const textColor = getTextColor(index);
          summaryRow.eachCell((cell) => styleSummaryCell(cell, textColor));
        });

        // Generate and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `transactions_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting transactions:', error);
        throw error;
      }
    },
  });
};

// Get daily contributions for a specific user
export const useDailyContributions = (
  filters: DailyContributionFilters,
  pagination: { page: number; limit: number },
) => {
  return useQuery({
    queryKey: ['daily-contributions', filters, pagination],
    queryFn: () =>
      TransactionService.fetchDailyContributions(filters, pagination),
    staleTime: 1000 * 60,
  });
};

export const useExportDailyContributions = () => {
  return useMutation({
    mutationFn: async (filters: DailyContributionFilters) => {
      try {
        const response = await axios.get(`${API_URL}/transactions/daily`, {
          params: {
            ...filters,
            limit: 999999, // Get all records
          },
        });

        const { data } = response;
        const dates = data.dates || [];
        const contributors = data.contributors || [];
        const totalColumns = dates.length + 3; // First name, Last name, dates, total

        // Create Excel file
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contributions Quotidiennes');

        // Add organization header
        worksheet.mergeCells(`A1:${String.fromCharCode(64 + totalColumns)}1`);
        const orgCell = worksheet.getCell('A1');
        orgCell.value = 'TRANSACTIONS';
        orgCell.font = {
          name: 'Arial',
          size: 16,
          bold: true,
          color: { argb: '000000' },
        };
        orgCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        worksheet.getRow(1).height = 30;

        // Add report title with date range in French
        worksheet.mergeCells(`A2:${String.fromCharCode(64 + totalColumns)}2`);
        const titleCell = worksheet.getCell('A2');
        const startDate = filters.startDate
          ? new Date(filters.startDate).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '';
        const endDate = filters.endDate
          ? new Date(filters.endDate).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '';
        titleCell.value = `Contributions Quotidiennes${startDate ? ` du ${startDate}` : ''}${endDate ? ` au ${endDate}` : ''}`;

        // Add empty row for spacing
        worksheet.addRow([]);

        // Define column headers
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

        const headerRow = worksheet.addRow(headers);

        // Set column widths
        worksheet.getColumn(1).width = 20; // First Name
        worksheet.getColumn(2).width = 20; // Last Name
        dates.forEach((_: string, index: number) => {
          worksheet.getColumn(index + 3).width = 15; // Date columns
        });
        worksheet.getColumn(totalColumns).width = 15; // Total column

        // Style header row
        const styleHeaderCell = (cell: ExcelJS.Cell) => {
          // eslint-disable-next-line no-param-reassign
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2B3544' },
          } as ExcelJS.Fill;

          // eslint-disable-next-line no-param-reassign
          cell.font = {
            bold: true,
            color: { argb: 'FFFFFF' },
            name: 'Arial',
            size: 12,
          } as ExcelJS.Font;

          // eslint-disable-next-line no-param-reassign
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          } as ExcelJS.Alignment;

          // eslint-disable-next-line no-param-reassign
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          } as ExcelJS.Borders;
        };

        headerRow.height = 25;
        headerRow.eachCell(styleHeaderCell);

        // Calculate daily totals for the total row with proper type checking and validation
        const calculateDailyTotal = (date: string) => {
          return contributors.reduce(
            (sum: number, contributor: DailyContributor) => {
              const contribution = contributor.contributions.find(
                (c: DailyContribution) => c.date === date,
              );
              const amount =
                contribution?.amount !== undefined &&
                contribution?.amount !== null
                  ? Number(contribution.amount)
                  : 0;
              return Number((sum + amount).toFixed(2));
            },
            0,
          );
        };

        const dailyTotals = dates.map((date: string) =>
          calculateDailyTotal(date),
        );

        // Calculate grand total correctly
        const grandTotal = dailyTotals.reduce((sum: number, amount: number) => {
          return Number((sum + amount).toFixed(2));
        }, 0);

        // Calculate individual contributor totals with proper validation
        contributors.forEach(
          (contributor: DailyContributor, contributorIndex: number) => {
            const rowData = [contributor.firstName, contributor.lastName];
            let contributorTotal = 0;

            // Calculate each day's contribution with proper validation
            dates.forEach((date: string) => {
              const contribution = contributor.contributions.find(
                (c: DailyContribution) => c.date === date,
              );
              const amount =
                contribution?.amount !== undefined &&
                contribution?.amount !== null
                  ? Number(contribution.amount)
                  : 0;
              contributorTotal = Number((contributorTotal + amount).toFixed(2));
              rowData.push(amount.toFixed(2));
            });

            // Add total amount for this contributor
            rowData.push(contributorTotal.toFixed(2));

            const dataRow = worksheet.addRow(rowData);

            // Style data row
            const styleDataCell = (
              cell: ExcelJS.Cell,
              colNumber: number,
              rowIndex: number,
            ) => {
              // eslint-disable-next-line no-param-reassign
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                  argb: rowIndex % 2 === 0 ? 'F3F4F6' : 'FFFFFF',
                },
              } as ExcelJS.Fill;

              // eslint-disable-next-line no-param-reassign
              cell.alignment = {
                horizontal: colNumber <= 2 ? 'left' : 'center',
                vertical: 'middle',
              } as ExcelJS.Alignment;

              // eslint-disable-next-line no-param-reassign
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              } as ExcelJS.Borders;

              // Format amount columns with proper number formatting
              if (colNumber > 2) {
                // eslint-disable-next-line no-param-reassign
                cell.value = Number(cell.value);
                // eslint-disable-next-line no-param-reassign
                cell.numFmt = '"$"#,##0.00';
                // eslint-disable-next-line no-param-reassign
                cell.font = {
                  color: { argb: '008000' },
                  bold: true,
                } as ExcelJS.Font;
              }
            };

            dataRow.eachCell((cell, colNumber) =>
              styleDataCell(cell, colNumber, contributorIndex),
            );
          },
        );

        // Add total row with proper number formatting
        const totalRow = worksheet.addRow([
          'Total Général',
          '',
          ...dailyTotals.map((amount: number) => amount.toFixed(2)),
          grandTotal.toFixed(2),
        ]);

        // Style total row
        const styleTotalCell = (cell: ExcelJS.Cell, colNumber: number) => {
          // eslint-disable-next-line no-param-reassign
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E5E7EB' },
          } as ExcelJS.Fill;

          // eslint-disable-next-line no-param-reassign
          cell.font = {
            bold: true,
            color: colNumber > 2 ? { argb: '008000' } : { argb: '000000' },
          } as ExcelJS.Font;

          // eslint-disable-next-line no-param-reassign
          cell.alignment = {
            horizontal: colNumber <= 2 ? 'left' : 'center',
            vertical: 'middle',
          } as ExcelJS.Alignment;

          // eslint-disable-next-line no-param-reassign
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          } as ExcelJS.Borders;

          if (colNumber > 2) {
            // eslint-disable-next-line no-param-reassign
            cell.value = Number(cell.value);
            // eslint-disable-next-line no-param-reassign
            cell.numFmt = '"$"#,##0.00';
          }
        };

        totalRow.eachCell(styleTotalCell);

        // Add validation check
        const calculatedTotal = contributors.reduce(
          (total: number, contributor: DailyContributor) => {
            const contributorTotal = contributor.contributions.reduce(
              (sum: number, contribution: DailyContribution) => {
                const amount =
                  contribution?.amount !== undefined &&
                  contribution?.amount !== null
                    ? Number(contribution.amount)
                    : 0;
                return Number((sum + amount).toFixed(2));
              },
              0,
            );
            return Number((total + contributorTotal).toFixed(2));
          },
          0,
        );

        if (Math.abs(calculatedTotal - grandTotal) > 0.01) {
          // Allow for small floating-point differences
          console.warn('Total mismatch detected:', {
            calculatedFromContributors: calculatedTotal,
            calculatedFromDailyTotals: grandTotal,
            difference: calculatedTotal - grandTotal,
          });
        }

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `contributions_quotidiennes_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting daily contributions:', error);
        throw error;
      }
    },
  });
};

// Move calculateStats function here, before useTransactionStats
const calculateStats = (
  currentMonth: Transaction[],
  lastMonth: Transaction[],
) => {
  // Calculate current month stats
  const totalIncomeUSD = currentMonth
    .filter(
      (t) => t.type === TransactionType.INCOME && t.currency === Currency.USD,
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeFC = currentMonth
    .filter(
      (t) => t.type === TransactionType.INCOME && t.currency === Currency.FC,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesUSD = currentMonth
    .filter(
      (t) => t.type === TransactionType.EXPENSE && t.currency === Currency.USD,
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesFC = currentMonth
    .filter(
      (t) => t.type === TransactionType.EXPENSE && t.currency === Currency.FC,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyIncomeUSD = currentMonth
    .filter(
      (t) =>
        t.type === TransactionType.INCOME &&
        t.currency === Currency.USD &&
        t.category === 'DAILY',
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyIncomeFC = currentMonth
    .filter(
      (t) =>
        t.type === TransactionType.INCOME &&
        t.currency === Currency.FC &&
        t.category === 'DAILY',
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate last month stats for comparison
  const lastMonthIncomeUSD = lastMonth
    .filter(
      (t) => t.type === TransactionType.INCOME && t.currency === Currency.USD,
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const lastMonthExpensesUSD = lastMonth
    .filter(
      (t) => t.type === TransactionType.EXPENSE && t.currency === Currency.USD,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: { USD: totalIncomeUSD, FC: totalIncomeFC },
    totalExpenses: { USD: totalExpensesUSD, FC: totalExpensesFC },
    totalRevenue: {
      USD: totalIncomeUSD - totalExpensesUSD,
      FC: totalIncomeFC - totalExpensesFC,
    },
    dailyIncome: { USD: dailyIncomeUSD, FC: dailyIncomeFC },
    incomeChange: lastMonthIncomeUSD
      ? ((totalIncomeUSD - lastMonthIncomeUSD) / lastMonthIncomeUSD) * 100
      : 0,
    expenseChange: lastMonthExpensesUSD
      ? ((totalExpensesUSD - lastMonthExpensesUSD) / lastMonthExpensesUSD) * 100
      : 0,
    revenueChange: lastMonthIncomeUSD
      ? ((totalIncomeUSD -
          totalExpensesUSD -
          (lastMonthIncomeUSD - lastMonthExpensesUSD)) /
          Math.abs(lastMonthIncomeUSD - lastMonthExpensesUSD)) *
        100
      : 0,
  };
};

// Get transaction statistics
export const useTransactionStats = () => {
  return useQuery({
    queryKey: ['transactionStats'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/transactions/stats`);
      return calculateStats(data.currentMonth, data.lastMonth);
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
        const { data: reportData } = await axios.get(
          `${API_URL}/transactions?${queryParams.toString()}`,
          {
            responseType: 'blob',
            headers: {
              Accept: 'application/pdf',
            },
          },
        );

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
        console.error('Error generating PDF:', error);
        throw error;
      }
    },
  });
};
