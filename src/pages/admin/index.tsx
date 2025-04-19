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
import { useAttendance } from '@/lib/attendance/logic';

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

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { attendance, loading: attendanceLoading } = useAttendance();
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

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await FetchUsers({ page: 1, limit: 10 });
        setTotalUsers(response.total);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  useEffect(() => {
    if (!attendance) {
      console.log('No attendance data available');
      return;
    }

    const yearlyStats = {
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
    };

    // Initialize monthly stats with safe type checking
    const monthlyStats = Array.from({ length: 12 }, () => ({
      present: 0,
      late: 0,
      absent: 0,
      total: 0,
    }));

    const currentYear = new Date().getFullYear();

    // First pass: Count total records per month and yearly totals
    Object.entries(attendance).forEach(([_userId, records]) => {
      if (!Array.isArray(records)) return;

      records.forEach((record) => {
        if (!record?.date || !record?.status) return;

        let recordDate: Date;
        if (record.date.includes('-')) {
          recordDate = new Date(record.date);
        } else {
          const [day, month, year] = record.date.split('/').map(Number);
          if (!day || !month || !year) return;
          recordDate = new Date(year, month - 1, day);
        }

        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth();

        // Ensure month is valid before accessing monthlyStats
        if (
          recordYear === currentYear &&
          recordMonth >= 0 &&
          recordMonth < 12
        ) {
          const monthStat = monthlyStats[recordMonth];
          if (!monthStat) return;

          monthStat.total += 1;

          switch (record.status) {
            case 'PRESENT':
              yearlyStats.totalPresent += 1;
              monthStat.present += 1;
              break;
            case 'LATE':
              yearlyStats.totalLate += 1;
              monthStat.late += 1;
              break;
            case 'ABSENT':
              yearlyStats.totalAbsent += 1;
              monthStat.absent += 1;
              break;
            default:
              console.warn('Unknown status:', record.status);
              break;
          }
        }
      });
    });

    // Calculate total records for the year
    const totalYearlyRecords =
      yearlyStats.totalPresent +
      yearlyStats.totalLate +
      yearlyStats.totalAbsent;

    // Debug log to check raw numbers
    console.log('Raw yearly totals:', {
      present: yearlyStats.totalPresent,
      late: yearlyStats.totalLate,
      absent: yearlyStats.totalAbsent,
      total: totalYearlyRecords,
    });

    // Calculate percentages for the cards
    const presentPercentage =
      totalYearlyRecords > 0
        ? Math.round((yearlyStats.totalPresent / totalYearlyRecords) * 100)
        : 0;
    const latePercentage =
      totalYearlyRecords > 0
        ? Math.round((yearlyStats.totalLate / totalYearlyRecords) * 100)
        : 0;
    const absentPercentage =
      totalYearlyRecords > 0
        ? Math.round((yearlyStats.totalAbsent / totalYearlyRecords) * 100)
        : 0;

    // Update metrics with percentages for cards
    setMetrics({
      totalPresent: presentPercentage, // Percentage for card display
      totalLate: latePercentage, // Percentage for card display
      totalAbsent: absentPercentage, // Percentage for card display
      attendanceRate: presentPercentage + latePercentage, // Total attendance rate (present + late)
    });

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

    // Convert monthly stats to chart format
    setAttendanceStats({
      present: monthlyStats.map((m) => m.present),
      late: monthlyStats.map((m) => m.late),
      absent: monthlyStats.map((m) => m.absent),
      dates: monthNames,
      totalPresent: yearlyStats.totalPresent,
      totalLate: yearlyStats.totalLate,
      totalAbsent: yearlyStats.totalAbsent,
    });
  }, [attendance]);

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
      <div className="flex w-full flex-col gap-6 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Tableau de bord</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Membres</p>
              <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <HiOutlineUserGroup className="size-6 text-blue-500" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Présences cette Année
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {metrics.attendanceRate}%
              </p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <HiOutlineCalendar className="size-6 text-green-500" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Retards cette Année
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {metrics.totalLate}%
              </p>
            </div>
            <div className="rounded-full bg-orange-50 p-3">
              <HiOutlineClock className="size-6 text-orange-500" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Absences cette Année
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {metrics.totalAbsent}%
              </p>
            </div>
            <div className="rounded-full bg-red-50 p-3">
              <HiOutlineExclamation className="size-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                État des présences
              </h3>
              <p className="text-sm text-gray-500">
                {new Date().getFullYear()}
              </p>
            </div>
            <div className="h-[60vh]">
              <Bar data={attendanceChartData} options={chartOptions} />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Distribution des Présences
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vue d&apos;ensemble de l&apos;année
                </p>
              </div>
              <p className="text-[20px] font-semibold text-gray-800">
                {new Date().getFullYear()}
              </p>
            </div>
            <div className="h-[60vh]">
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
