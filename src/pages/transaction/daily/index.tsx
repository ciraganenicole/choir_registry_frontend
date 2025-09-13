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
  DailyContributor,
} from '@/lib/transaction/types';
import type { User } from '@/lib/user/type';
import { FetchUsers } from '@/lib/user/user_actions';
import { logger } from '@/utils/logger';

const DailyContributions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [conversionRate, setConversionRate] = useState<number>(2800);
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
    useQuery({
      queryKey: [
        'daily-contributions',
        filters,
        { page: currentPage, limit: 1000 },
      ],
      queryFn: () =>
        TransactionService.fetchDailyContributions(filters, {
          page: currentPage,
          limit: 1000,
        }),
      staleTime: 0,
    });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', { page: currentPage, limit: 1000 }],
    queryFn: () => FetchUsers({ page: currentPage, limit: 1000 }),
    staleTime: 0,
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
      const dates =
        (contributionsData as any)?.dates ||
        (contributionsData as any)?.data?.dates ||
        [];
      const contributors =
        (contributionsData as any)?.contributors ||
        (contributionsData as any)?.data?.contributors ||
        [];
      const summaries = (usersData?.data || []).map((user) => {
        const c = contributors.find(
          (contributor: any) => contributor.userId === user.id,
        );
        const dailyContributions = dates.map((date: any) => {
          const contribution = c?.contributions.find(
            (con: any) => con.date === date,
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
          ? c.contributions.filter((con: any) => con.currency === 'USD')
          : [];
        const allFC = c
          ? c.contributions.filter((con: any) => con.currency === 'FC')
          : [];
        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          totalAmountUSD: allUSD.reduce(
            (sum: any, con: any) => sum + con.amount,
            0,
          ),
          totalAmountFC: allFC.reduce(
            (sum: any, con: any) => sum + con.amount,
            0,
          ),
          contributionDates: c
            ? c.contributions.map((con: any) => con.date)
            : [],
          frequency: c ? c.contributions.length : 0,
          dailyContributions,
        };
      });
      await exportToPDF(summaries, conversionRate);
    } catch (error) {
      logger.error('Error exporting daily contributions as PDF:', error);
    }
  };

  const dates =
    (contributionsData as any)?.dates ||
    (contributionsData as any)?.data?.dates ||
    [];
  const contributors =
    (contributionsData as any)?.contributors ||
    (contributionsData as any)?.data?.contributors ||
    [];
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 mt-6 md:mt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-4xl md:text-3xl">
                Contributions Quotidiennes
              </h1>
              <p className="mt-2 text-xs text-gray-600 sm:text-base md:text-sm">
                Suivi des contributions journalières des membres
              </p>
            </div>
            <div className="flex flex-row items-center gap-1 md:gap-3">
              <SearchInput onSearch={handleSearch} />
              <div className="flex items-center gap-1 md:gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm md:px-3 md:py-2">
                  <label
                    htmlFor="conversionRate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Taux:
                  </label>
                  <input
                    id="conversionRate"
                    type="number"
                    min="1"
                    step="1"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(Number(e.target.value))}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="2800"
                  />
                  <span className="text-sm text-gray-600">FC</span>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-1 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 md:rounded-lg md:px-4 md:py-2"
                >
                  <Download className="size-4" />
                  <span className="hidden sm:inline">Exporter PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <DailyFilters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
          />
        </div>

        {/* Summary Cards */}
        <div className="mb-8 hidden gap-6 md:grid md:grid-cols-3">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-700">
                  Total USD
                </h3>
                <p className="text-xs text-green-600">
                  Contributions en dollars
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-green-800">
                ${totals.usd.toFixed(2)}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-700">Total FC</h3>
                <p className="text-xs text-blue-600">Contributions en francs</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-blue-800">
                {totals.fc.toFixed(2)} FC
              </div>
              <div className="mt-1 text-xs text-blue-600">
                ≈ ${(totals.fc / conversionRate).toFixed(2)} USD
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500 p-3">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-purple-700">
                  Participants
                </h3>
                <p className="text-xs text-purple-600">Membres actifs</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-purple-800">
                {contributors.length}
              </div>
              <div className="mt-1 text-xs text-purple-600">
                sur {users.length} membres
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-500">Chargement...</p>
                  </div>
                </div>
              ) : (
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Membre
                      </th>
                      {dates.map((date: string) => (
                        <th
                          key={date}
                          className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{format(parseISO(date), 'dd')}</span>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(date), 'MMM')}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
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
                        <tr
                          key={user.id}
                          className="group transition-colors hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                                <span className="text-xs font-medium text-white">
                                  {user.firstName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          {dates.map((date: string) => {
                            const contribution =
                              contributor?.contributions.find(
                                (c: any) => c.date === date,
                              );
                            return (
                              <td
                                key={date}
                                className="whitespace-nowrap p-4 text-center text-sm"
                              >
                                {contribution ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="font-semibold text-green-600">
                                      {contribution.amount.toFixed(0)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {contribution.currency === 'USD'
                                        ? 'USD'
                                        : 'FC'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <div className="flex flex-col gap-1">
                              {contributorTotal.usd > 0 && (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-bold text-green-600">
                                    ${contributorTotal.usd.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    USD
                                  </span>
                                </div>
                              )}
                              {contributorTotal.fc > 0 && (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-bold text-blue-600">
                                    {contributorTotal.fc.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    FC
                                  </span>
                                </div>
                              )}
                              {contributorTotal.usd === 0 &&
                                contributorTotal.fc === 0 && (
                                  <span className="text-sm text-gray-500">
                                    0
                                  </span>
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
        <div className="space-y-6 md:hidden">
          {isLoading ? (
            <Card className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-500">Chargement des contributions...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-green-500 p-2">
                      <svg
                        className="size-4 text-white"
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
                    <span className="text-sm font-medium text-green-700">
                      USD
                    </span>
                  </div>
                  <div className="text-xl font-bold text-green-800">
                    ${totals.usd.toFixed(2)}
                  </div>
                </Card>

                <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-blue-500 p-2">
                      <svg
                        className="size-4 text-white"
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
                    <span className="text-sm font-medium text-blue-700">
                      FC
                    </span>
                  </div>
                  <div className="text-xl font-bold text-blue-800">
                    {totals.fc.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    ≈ ${(totals.fc / conversionRate).toFixed(2)}
                  </div>
                </Card>
              </div>

              {/* Member Cards */}
              {users.map((user: User) => {
                const contributor = contributors.find(
                  (c: any) => c.userId === user.id,
                );
                const contributorTotal = contributor
                  ? calculateContributorTotal(contributor)
                  : { usd: 0, fc: 0 };

                const hasContributions =
                  contributorTotal.usd > 0 || contributorTotal.fc > 0;

                return (
                  <Card
                    key={user.id}
                    className="overflow-hidden border-0 shadow-lg"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                          <span className="text-sm font-medium text-white">
                            {user.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="mt-1 flex items-center gap-4">
                            {contributorTotal.usd > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-green-600">
                                  ${contributorTotal.usd.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  USD
                                </span>
                              </div>
                            )}
                            {contributorTotal.fc > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-blue-600">
                                  {contributorTotal.fc.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  FC
                                </span>
                              </div>
                            )}
                            {!hasContributions && (
                              <span className="text-sm text-gray-500">
                                Aucune contribution
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {hasContributions && (
                      <div className="p-6">
                        <h4 className="mb-4 text-sm font-medium text-gray-700">
                          Contributions par jour
                        </h4>
                        <div className="space-y-3">
                          {dates.map((date: string) => {
                            const contribution =
                              contributor?.contributions.find(
                                (c: any) => c.date === date,
                              );
                            return (
                              <div
                                key={date}
                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(date)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {contribution ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-sm font-bold text-green-600">
                                        {contribution.amount.toFixed(0)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {contribution.currency === 'USD'
                                          ? 'USD'
                                          : 'FC'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">
                                      —
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
