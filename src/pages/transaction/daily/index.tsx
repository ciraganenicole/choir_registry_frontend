import { Download } from 'lucide-react';
import { useState } from 'react';

import { Card } from '@/components/card';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import DailyFilters from '@/lib/transaction/components/filters';
import {
  useDailyContributions,
  useExportDailyContributions,
} from '@/lib/transaction/logic';
import type { DailyContributionFilters } from '@/lib/transaction/types';
import { logger } from '@/utils/logger';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
  });
};

const DailyContributions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DailyContributionFilters>({
    startDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString(),
    endDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).toISOString(),
  });

  const { data, isLoading } = useDailyContributions(filters, {
    page: currentPage,
    limit: 10,
  });

  const exportDailyContributions = useExportDailyContributions();

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setCurrentPage(1);
  };

  const handleFilterChange = (
    newFilters: Partial<DailyContributionFilters>,
  ) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleExport = async (format: 'csv') => {
    try {
      await exportDailyContributions.mutateAsync(filters);
    } catch (error) {
      logger.error(`Error exporting daily contributions as ${format}:`, error);
    }
  };

  const dates = data?.dates || [];
  const contributors = data?.contributors || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  // Calculate total amounts correctly by summing individual contributions
  const calculateContributorTotal = (contributor: any) => {
    return contributor.contributions.reduce(
      (sum: number, contribution: any) => {
        return Number((sum + (contribution?.amount || 0)).toFixed(2));
      },
      0,
    );
  };

  // Calculate the grand total correctly
  const totalUSD = contributors.reduce((sum, contributor) => {
    const contributorTotal = calculateContributorTotal(contributor);
    return Number((sum + contributorTotal).toFixed(2));
  }, 0);

  return (
    <Layout>
      <div className="p-2 sm:p-4 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 py-1 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <h2 className="text-lg font-semibold sm:text-xl md:text-2xl">
                Contributions Quotidiennes
              </h2>
              <p className="text-xs text-gray-500 sm:text-sm">
                {filters.startDate &&
                  new Date(filters.startDate).toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                  })}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
              <SearchInput onSearch={handleSearch} />
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center rounded-md border-[1px] border-gray-900/50 px-3 py-1.5 text-sm text-gray-900 shadow-sm hover:bg-gray-50 sm:px-4 sm:py-2"
              >
                <Download className="size-4 md:mr-2" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mt-1">
          <DailyFilters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <p>Chargement...</p>
                </div>
              ) : (
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                        Prénom
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                        Nom
                      </th>
                      {dates.map((date) => (
                        <th
                          key={date}
                          className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                        >
                          {formatDate(date)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {contributors.map((contributor) => {
                      const contributorTotal =
                        calculateContributorTotal(contributor);
                      return (
                        <tr key={contributor.userId}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm sm:px-6">
                            {contributor.firstName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm sm:px-6">
                            {contributor.lastName}
                          </td>
                          {dates.map((date) => {
                            const contribution = contributor.contributions.find(
                              (c) => c.date === date,
                            );
                            return (
                              <td
                                key={date}
                                className="whitespace-nowrap px-4 py-3 text-center text-sm sm:px-6"
                              >
                                {contribution ? (
                                  <span className="text-green-600">
                                    ${contribution.amount.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-semibold sm:px-6">
                            ${contributorTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="space-y-4 md:hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : (
            <>
              {/* Mobile Total */}
              <Card className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 shadow-lg sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-white sm:text-lg">
                    Total Général
                  </span>
                  <span className="text-base font-bold text-green-400 sm:text-lg">
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>
              </Card>
              {contributors.map((contributor) => (
                <Card
                  key={contributor.userId}
                  className="overflow-hidden bg-white p-2 shadow-sm"
                >
                  <div className="border-b border-gray-200 bg-gray-50/50 p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900 sm:text-lg">
                          {contributor.firstName} {contributor.lastName}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-green-600 sm:text-base">
                          Total: $
                          {calculateContributorTotal(contributor).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-y-0">
                    {dates.map((date, index) => {
                      const contribution = contributor.contributions.find(
                        (c) => c.date === date,
                      );
                      return (
                        <div
                          key={date}
                          className={`flex items-center justify-between p-3 sm:p-4 ${
                            index % 2 === 0 ? 'sm:bg-gray-50/50' : ''
                          } ${
                            index % 2 === 1 ? 'border-gray-200 sm:border-l' : ''
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 sm:text-base">
                              {formatDate(date)}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-medium sm:text-base ${
                              contribution ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {contribution
                              ? `$${contribution.amount.toFixed(2)}`
                              : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-2 sm:mt-6">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </Layout>
  );
};

export default DailyContributions;
