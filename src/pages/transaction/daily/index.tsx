import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { useState } from 'react';

import { Card } from '@/components/card';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import DailyFilters from '@/lib/transaction/components/filters';
import { exportToPDF } from '@/lib/transaction/excel';
import { TransactionService } from '@/lib/transaction/service';
import type {
  DailyContributionFilters,
  DailyContributionsResponse,
  DailyContributor,
} from '@/lib/transaction/types';
import type { User } from '@/lib/user/type';
import { FetchUsers } from '@/lib/user/user_actions';
import { logger } from '@/utils/logger';

const formatDate = (dateString: string) => {
  return format(parseISO(dateString), 'dd/MM/yyyy');
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

  const { data: contributionsData, isLoading: isContributionsLoading } =
    useQuery<DailyContributionsResponse>({
      queryKey: [
        'daily-contributions',
        filters,
        { page: currentPage, limit: 10 },
      ],
      queryFn: () =>
        TransactionService.fetchDailyContributions(filters, {
          page: currentPage,
          limit: 10,
        }),
      staleTime: 1000 * 60,
    });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', { page: currentPage, limit: 1000 }],
    queryFn: () => FetchUsers({ page: currentPage, limit: 1000 }),
    staleTime: 1000 * 60,
  });

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

  const handleExport = async () => {
    try {
      const dates = contributionsData?.dates || [];
      const contributors = contributionsData?.contributors || [];
      const summaries = (usersData?.data || []).map((user) => {
        const c = contributors.find(
          (contributor) => contributor.userId === user.id,
        );
        // Build dailyContributions array for this user
        const dailyContributions = dates.map((date) => {
          const contribution = c?.contributions.find(
            (con) => con.date === date,
          );
          return {
            date,
            amountFC:
              contribution && contribution.currency === 'FC'
                ? contribution.amount
                : 0,
            amountUSD:
              contribution && contribution.currency === 'USD'
                ? contribution.amount
                : 0,
          };
        });
        const allUSD = c
          ? c.contributions.filter((con) => con.currency === 'USD')
          : [];
        const allFC = c
          ? c.contributions.filter((con) => con.currency === 'FC')
          : [];
        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          totalAmountUSD: allUSD.reduce((sum, con) => sum + con.amount, 0),
          totalAmountFC: allFC.reduce((sum, con) => sum + con.amount, 0),
          contributionDates: c ? c.contributions.map((con) => con.date) : [],
          frequency: c ? c.contributions.length : 0,
          dailyContributions,
        };
      });
      await exportToPDF(summaries);
    } catch (error) {
      logger.error('Error exporting daily contributions as PDF:', error);
    }
  };

  const dates = contributionsData?.dates || [];
  const contributors = contributionsData?.contributors || [];
  const users = usersData?.data || [];

  // Calculate total amounts correctly by summing individual contributions
  const calculateContributorTotal = (contributor: any) => {
    const totals = contributor.contributions.reduce(
      (acc: { usd: number; fc: number }, contribution: any) => {
        if (contribution.currency === 'USD') {
          acc.usd += contribution.amount;
        } else if (contribution.currency === 'FC') {
          acc.fc += contribution.amount;
        }
        return acc;
      },
      { usd: 0, fc: 0 },
    );
    return {
      usd: Number(totals.usd.toFixed(2)),
      fc: Number(totals.fc.toFixed(2)),
    };
  };

  // Calculate the grand totals correctly
  const totals = contributors.reduce(
    (acc: { usd: number; fc: number }, contributor: DailyContributor) => {
      const contributorTotal = calculateContributorTotal(contributor);
      return {
        usd: Number((acc.usd + contributorTotal.usd).toFixed(2)),
        fc: Number((acc.fc + contributorTotal.fc).toFixed(2)),
      };
    },
    { usd: 0, fc: 0 },
  );

  const isLoading = isContributionsLoading || isUsersLoading;

  return (
    <Layout>
      <div className="p-2 sm:p-4 lg:px-8">
        {/* Header Section */}
        <div className="mt-8 flex flex-col gap-4 py-1 sm:py-4 md:mt-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <h2 className="text-lg font-semibold sm:text-xl md:text-2xl">
                Contributions Quotidiennes
              </h2>
              <p className="text-xs text-gray-500 sm:text-sm">
                {filters.startDate &&
                  format(parseISO(filters.startDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
              <SearchInput onSearch={handleSearch} />
              <button
                onClick={handleExport}
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
                      {dates.map((date: string) => (
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
                    {users.map((user: User) => {
                      const contributor = contributors.find(
                        (c: any) => c.userId === user.id,
                      );
                      const contributorTotal = contributor
                        ? calculateContributorTotal(contributor)
                        : { usd: 0, fc: 0 };
                      return (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">
                            {user.firstName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">
                            {user.lastName}
                          </td>
                          {dates.map((date: string) => {
                            const contribution =
                              contributor?.contributions.find(
                                (c: any) => c.date === date,
                              );
                            return (
                              <td
                                key={date}
                                className="whitespace-nowrap px-4 py-3 text-center text-sm sm:px-6"
                              >
                                {contribution ? (
                                  <span className="text-green-600">
                                    {contribution.amount.toFixed(0)}
                                    <span className="ml-1">
                                      {contribution.currency === 'USD'
                                        ? '$'
                                        : 'fc '}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-bold sm:px-6">
                            <div className="flex flex-col gap-1">
                              {contributorTotal.usd > 0 && (
                                <span className="text-green-600">
                                  {contributorTotal.usd.toFixed(2)} $
                                </span>
                              )}
                              {contributorTotal.fc > 0 && (
                                <span className="text-green-600">
                                  {contributorTotal.fc.toFixed(2)} fc
                                </span>
                              )}
                              {contributorTotal.usd === 0 &&
                                contributorTotal.fc === 0 && (
                                  <span className="text-gray-700">0</span>
                                )}
                            </div>
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
                    ${totals.usd.toFixed(2)}
                  </span>
                </div>
              </Card>
              {users.map((user: User) => {
                const contributor = contributors.find(
                  (c: any) => c.userId === user.id,
                );
                const contributorTotal = contributor
                  ? calculateContributorTotal(contributor)
                  : { usd: 0, fc: 0 };
                return (
                  <Card
                    key={user.id}
                    className="overflow-hidden bg-white p-2 shadow-sm"
                  >
                    <div className="border-b border-gray-200 bg-gray-50/50 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 sm:text-lg">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-green-600 sm:text-base">
                            {contributorTotal.usd > 0 && (
                              <span>
                                USD: ${contributorTotal.usd.toFixed(2)}
                              </span>
                            )}
                            {contributorTotal.usd > 0 &&
                              contributorTotal.fc > 0 && <br />}
                            {contributorTotal.fc > 0 && (
                              <span>FC: {contributorTotal.fc.toFixed(2)}</span>
                            )}
                            {contributorTotal.usd === 0 &&
                              contributorTotal.fc === 0 && <span>—</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-y-0">
                      {dates.map((date: string, index: number) => {
                        const contribution = contributor?.contributions.find(
                          (c: any) => c.date === date,
                        );
                        return (
                          <div
                            key={date}
                            className={`flex items-center justify-between p-3 sm:p-4 ${
                              index % 2 === 0 ? 'sm:bg-gray-50/50' : ''
                            } ${
                              index % 2 === 1
                                ? 'border-gray-200 sm:border-l'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 sm:text-base">
                                {formatDate(date)}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium sm:text-base ${
                                contribution
                                  ? 'text-green-600'
                                  : 'text-gray-400'
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
                );
              })}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DailyContributions;
