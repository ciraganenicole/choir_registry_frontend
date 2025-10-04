import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaEdit, FaEye, FaTrash } from 'react-icons/fa';

import {
  canDeleteReport,
  canEditReport,
  hasReportsAccess,
} from '@/lib/report/permissions';
import { ReportService } from '@/lib/report/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Report } from '@/types/report.types';

interface ReportListProps {
  showActions?: boolean;
  onEdit?: (report: Report) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

const ReportList: React.FC<ReportListProps> = ({
  showActions = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to reports
  const userHasReportsAccess = hasReportsAccess(user);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportService.getAllReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userHasReportsAccess) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [userHasReportsAccess]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (report: Report) => {
    if (canDeleteReport(user) && onDelete) {
      onDelete(report.id);
    }
  };

  if (!userHasReportsAccess) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Accès Refusé
            </h2>
            <p className="text-gray-500">
              Seuls les membres du comité, les leaders et les administrateurs
              peuvent accéder aux rapports.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Chargement des rapports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Aucun rapport disponible</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-2 md:space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md md:p-6"
          >
            <div className="mb-3 flex flex-col items-start justify-between md:flex-row">
              <h3 className="line-clamp-2 flex-1 text-[14px] font-semibold text-gray-900 md:text-lg">
                {report.title}
              </h3>
              <div className="ml-0 flex items-center text-[10px] text-gray-500 md:ml-4 md:text-sm">
                <FaCalendarAlt className="mr-1" />
                {formatDate(report.meetingDate)}
              </div>
            </div>

            <div className="mb-4 line-clamp-3 whitespace-pre-wrap text-[10px] text-gray-700 md:text-sm">
              {report.content}
            </div>

            <div className="flex flex-col justify-between md:flex-row">
              <div className="flex items-center text-[12px] text-gray-500 md:text-sm">
                <span className="mx-2">•</span>
                <span>Créé le {formatDateTime(report.createdAt)}</span>
              </div>

              {showActions && (
                <div className="mt-2 flex items-center space-x-4 border-t border-gray-200 pt-2 md:mt-0">
                  <Link
                    href={`/committee/reports/${report.id}`}
                    className="rounded p-1 text-green-600 transition-colors hover:bg-green-50 hover:text-green-800"
                    title="Voir le rapport"
                  >
                    <FaEye />
                  </Link>
                  {canEditReport(user, report) && onEdit && (
                    <button
                      onClick={() => onEdit(report)}
                      className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {canDeleteReport(user) && onDelete && (
                    <button
                      onClick={() => handleDeleteClick(report)}
                      className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportList;
