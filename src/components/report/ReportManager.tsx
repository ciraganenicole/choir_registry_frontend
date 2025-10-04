import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaFileAlt, FaPlus, FaUsers } from 'react-icons/fa';

import ConfirmationDialog from '@/components/dialog/ConfirmationDialog';
import { hasReportsAccess } from '@/lib/report/permissions';
import { ReportService } from '@/lib/report/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Report } from '@/types/report.types';

import ReportList from './ReportList';

const ReportManager: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check if user has access to reports
  const userHasReportsAccess = hasReportsAccess(user);

  const fetchReportsForStats = async () => {
    try {
      setStatsLoading(true);
      const data = await ReportService.getAllReports();
      setReports(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch reports for stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch reports for stats calculation
  useEffect(() => {
    if (userHasReportsAccess) {
      fetchReportsForStats();
    }
  }, [userHasReportsAccess, refreshTrigger]);

  // Calculate stats
  const getTotalReports = () => reports.length;

  const getReportsThisMonth = () => {
    const now = new Date();
    // Create month boundaries in local time, then convert to UTC for comparison
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthReports = reports.filter((report) => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= startOfMonth && reportDate <= endOfMonth;
    });

    return monthReports.length;
  };

  const getReportsThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekReports = reports.filter((report) => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= startOfWeek && reportDate <= endOfWeek;
    });

    return weekReports.length;
  };

  const handleCreateNew = () => {
    router.push('/committee/reports/new');
  };

  const handleEdit = (report: Report) => {
    router.push(`/committee/reports/${report.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    if (!userHasReportsAccess) {
      // eslint-disable-next-line no-alert
      alert("Vous n'avez pas l'autorisation de supprimer des rapports.");
      return;
    }

    // Find the report to get its title
    const report = await ReportService.getReportById(id);
    setReportToDelete({ id, title: report.title });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      setIsDeleting(true);
      await ReportService.deleteReport(reportToDelete.id);
      setRefreshTrigger((prev) => prev + 1); // This will trigger stats refresh
      setShowDeleteDialog(false);
      setReportToDelete(null);
    } catch (error: any) {
      // eslint-disable-next-line no-alert
      alert(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setReportToDelete(null);
  };

  if (!userHasReportsAccess) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <FaUsers className="mx-auto text-6xl text-gray-300" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Accès Restreint
          </h2>
          <p className="mb-4 text-gray-600">
            Seuls les membres du comité et les administrateurs peuvent accéder
            aux rapports de réunion.
          </p>
          <p className="text-sm text-gray-500">
            Contactez un administrateur si vous pensez avoir besoin
            d&apos;accès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2 md:mt-0 md:space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-[14px] font-bold text-gray-900 md:text-2xl">
              <FaFileAlt className="mr-1 text-blue-600 md:mr-3" />
              Rapports de Réunion
            </h1>
            <p className="mt-1 text-[10px] text-gray-500 md:text-[14px]">
              Gérez les rapports des réunions du comité
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 md:px-4"
          >
            <FaPlus className="mr-0 md:mr-2" />
            <span className="hidden md:block md:text-[14px]">
              Nouveau Rapport
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-3 gap-1 md:gap-4">
          <div className="rounded-lg bg-blue-50 p-2 md:p-4">
            <div className="flex">
              <FaFileAlt className="mr-1 text-[12px] text-blue-600 md:mr-3 md:text-xl" />
              <div>
                <p className="text-[10px] font-medium text-blue-900 md:text-[14px]">
                  Totaux
                </p>
                <p className="text-[12px] font-bold text-blue-600 md:text-2xl">
                  {statsLoading ? (
                    <div className="h-8 w-12 animate-pulse rounded bg-blue-200"></div>
                  ) : (
                    getTotalReports()
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-2 md:p-4">
            <div className="flex">
              <FaCalendarAlt className="mr-1 text-[12px] text-green-600 md:mr-3 md:text-xl" />
              <div>
                <p className="text-[10px] font-medium text-green-900 md:text-[14px]">
                  Ce Mois
                </p>
                <p className="text-[12px] font-bold text-green-600 md:text-2xl">
                  {statsLoading ? (
                    <div className="h-8 w-12 animate-pulse rounded bg-green-200"></div>
                  ) : (
                    getReportsThisMonth()
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-orange-50 p-2 md:p-4">
            <div className="flex">
              <FaCalendarAlt className="mr-1 text-[12px] text-orange-600 md:mr-3 md:text-xl" />
              <div>
                <p className="text-[10px] font-medium text-orange-900 md:text-[14px]">
                  Cette Semaine
                </p>
                <p className="text-[12px] font-bold text-orange-600 md:text-2xl">
                  {statsLoading ? (
                    <div className="h-8 w-12 animate-pulse rounded bg-orange-200"></div>
                  ) : (
                    getReportsThisWeek()
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-2 md:p-6">
          <ReportList
            key={refreshTrigger}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer le rapport"
        message={`Êtes-vous sûr de vouloir supprimer le rapport "${reportToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ReportManager;
