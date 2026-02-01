import 'chart.js/auto';

import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineUserGroup,
} from 'react-icons/hi';

import Layout from '@/components/layout';
import { api } from '@/config/api';

import { FetchUsers } from '../../lib/user/user_actions';

interface AttendanceMetrics {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  attendanceRate: number;
}

interface AttendanceStats {
  present: number[];
  late: number[];
  absent: number[];
  dates: string[];
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
}

interface OverallStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused?: number;
}

interface GroupedAttendanceStats {
  overall: OverallStats;
  byDate: {
    [date: string]: OverallStats;
  };
  byEventType: {
    [eventType: string]: OverallStats;
  };
}

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [overallStats, setOverallStats] =
    useState<GroupedAttendanceStats | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    attendanceRate: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: [],
    late: [],
    absent: [],
    dates: [],
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: currentYear - 2023 + 1 },
      (_, i) => currentYear - i,
    );
  }, []);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await FetchUsers({ page: 1, limit: 10 });
        setTotalUsers(response.total);
      } catch (error) {
        // Silently ignore user fetch errors - component will handle empty state
        console.warn('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      setAttendanceLoading(true);
      try {
        // Calculate date range for the selected year
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;

        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);

        const response = await api.get(
          `/attendance/stats/overall?${queryParams.toString()}`,
        );

        setOverallStats(response.data);
      } catch (error) {
        console.error('Failed to fetch attendance statistics:', error);
        setOverallStats(null);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendanceStats();
  }, [selectedYear]);

  useEffect(() => {
    if (!overallStats) {
      setMetrics({
        totalPresent: 0,
        totalLate: 0,
        totalAbsent: 0,
        attendanceRate: 0,
      });
      setAttendanceStats({
        present: [],
        late: [],
        absent: [],
        dates: [],
        totalPresent: 0,
        totalLate: 0,
        totalAbsent: 0,
      });
      return;
    }

    const { overall, byDate } = overallStats;

    // Calculate percentages
    const totalYearlyRecords = overall.total;
    const presentPercentage =
      totalYearlyRecords > 0
        ? Math.round((overall.present / totalYearlyRecords) * 100)
        : 0;
    const latePercentage =
      totalYearlyRecords > 0
        ? Math.round((overall.late / totalYearlyRecords) * 100)
        : 0;
    const absentPercentage =
      totalYearlyRecords > 0
        ? Math.round((overall.absent / totalYearlyRecords) * 100)
        : 0;

    setMetrics({
      totalPresent: presentPercentage,
      totalLate: latePercentage,
      totalAbsent: absentPercentage,
      attendanceRate: presentPercentage + latePercentage, // Total attendance rate (present + late)
    });

    // Group by month from byDate data
    const monthlyStats = Array.from({ length: 12 }, () => ({
      present: 0,
      late: 0,
      absent: 0,
    }));

    Object.entries(byDate as Record<string, OverallStats>).forEach(
      ([dateStr, stats]) => {
        const date = new Date(dateStr);
        const month = date.getMonth();

        const monthStats = monthlyStats[month];
        if (!monthStats) return;

        monthStats.present += stats.present ?? 0;
        monthStats.late += stats.late ?? 0;
        monthStats.absent += stats.absent ?? 0;
      },
    );

    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    setAttendanceStats({
      present: monthlyStats.map((m) => m.present),
      late: monthlyStats.map((m) => m.late),
      absent: monthlyStats.map((m) => m.absent),
      dates: monthNames,
      totalPresent: overall.present,
      totalLate: overall.late,
      totalAbsent: overall.absent,
    });
  }, [overallStats]);

  const attendanceChartData = useMemo(
    () => ({
      labels: attendanceStats.dates,
      datasets: [
        {
          label: 'Présent',
          backgroundColor: '#04cc25',
          data: attendanceStats.present,
          borderRadius: 4,
        },
        {
          label: 'Retard',
          backgroundColor: '#fc842d',
          data: attendanceStats.late,
          borderRadius: 4,
        },
        {
          label: 'Absent',
          backgroundColor: '#cc0411',
          data: attendanceStats.absent,
          borderRadius: 4,
        },
      ],
    }),
    [attendanceStats],
  );

  const distributionChartData = useMemo(
    () => ({
      labels: ['Présent', 'Retard', 'Absent'],
      datasets: [
        {
          data: [
            attendanceStats.totalPresent,
            attendanceStats.totalLate,
            attendanceStats.totalAbsent,
          ],
          backgroundColor: ['#04cc25', '#fc842d', '#cc0411'],
          borderWidth: 0,
        },
      ],
    }),
    [attendanceStats],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
      },
    },
    barPercentage: 0.7,
    categoryPercentage: 0.9,
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '70%',
  };

  if (loading || attendanceLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-2 p-6 md:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="mt-8 text-xl font-semibold text-gray-900 md:mt-0">
            Tableau de bord
          </h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg border-l-4 border-blue-500 bg-white p-2 shadow-sm md:p-6">
            <div>
              <p className="text-xs font-medium text-gray-500 md:text-sm">
                Total Membres
              </p>
              <p className="mt-2 text-xl font-semibold md:text-3xl">
                {totalUsers}
              </p>
            </div>
            <div className="hidden rounded-full bg-blue-50 p-3 md:block">
              <HiOutlineUserGroup className="size-3 text-blue-500 md:size-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border-l-4 border-green-500 bg-white p-2 shadow-sm md:p-6">
            <div>
              <p className="text-xs font-medium text-gray-500 md:text-sm">
                Présences cette Année
              </p>
              <p className="mt-2 text-xl font-semibold md:text-3xl">
                {metrics.attendanceRate}%
              </p>
            </div>
            <div className="hidden rounded-full bg-green-50 p-3 md:block">
              <HiOutlineCalendar className="size-3 text-green-500 md:size-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border-l-4 border-orange-500 bg-white p-2 shadow-sm md:p-6">
            <div>
              <p className="text-xs font-medium text-gray-500 md:text-sm">
                Retards cette Année
              </p>
              <p className="mt-2 text-xl font-semibold md:text-3xl">
                {metrics.totalLate}%
              </p>
            </div>
            <div className="hidden rounded-full bg-orange-50 p-3 md:block">
              <HiOutlineClock className="size-3 text-orange-500 md:size-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border-l-4 border-red-500 bg-white p-2 shadow-sm md:p-6">
            <div>
              <p className="text-xs font-medium text-gray-500 md:text-sm">
                Absences cette Année
              </p>
              <p className="mt-2 text-xl font-semibold md:text-3xl">
                {metrics.totalAbsent}%
              </p>
            </div>
            <div className="hidden rounded-full bg-red-50 p-3 md:block">
              <HiOutlineExclamation className="size-3 text-red-500 md:size-6" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:mt-0 md:gap-4 lg:grid-cols-3">
          <div className="hidden rounded-sm bg-white p-4 shadow-sm md:col-span-2 md:block md:rounded-lg">
            <div className="mb-2 flex items-center justify-between md:mb-4">
              <h3 className="text-sm font-medium text-gray-900 md:text-lg">
                État des présences
              </h3>
              <p className="text-[16px] font-semibold text-gray-800 md:text-[20px]">
                {selectedYear}
              </p>
            </div>
            <div className="h-[35vh] md:h-[60vh]">
              <Bar data={attendanceChartData} options={chartOptions} />
            </div>
          </div>

          <div className="rounded-[10px] bg-white p-2 shadow-sm md:rounded-lg md:p-6">
            <div className="flex justify-between">
              <div className="mb-2 md:mb-6">
                <h3 className="text-sm font-medium text-gray-900 md:text-lg">
                  Distribution des Présences
                </h3>
                <p className="mt-1 text-xs text-gray-500 md:text-sm">
                  Vue d&apos;ensemble de l&apos;année
                </p>
              </div>
              <p className="text-[16px] font-semibold text-gray-800 md:text-[20px]">
                {selectedYear}
              </p>
            </div>
            <div className="h-[40vh] md:h-[60vh]">
              <Doughnut
                data={distributionChartData}
                options={doughnutOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
