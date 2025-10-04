import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEdit,
  FaFilePdf,
  FaPaperclip,
  FaTrash,
  FaUser,
} from 'react-icons/fa';

import Layout from '@/components/layout';
import { exportReportToPDF } from '@/lib/report/pdf-export';
import {
  canDeleteReport,
  canEditReport,
  hasReportsAccess,
} from '@/lib/report/permissions';
import { ReportService } from '@/lib/report/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Report } from '@/types/report.types';

const ReportDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to reports
  const userHasReportsAccess = hasReportsAccess(user);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportService.getReportById(Number(id));
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && userHasReportsAccess) {
      fetchReport();
    } else if (!userHasReportsAccess) {
      setLoading(false);
    }
  }, [id, userHasReportsAccess]);

  const handleDelete = async () => {
    if (!report) return;

    // eslint-disable-next-line no-alert
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.',
      )
    ) {
      try {
        await ReportService.deleteReport(report.id);
        router.push('/committee/reports');
      } catch (deleteError: any) {
        // eslint-disable-next-line no-alert
        alert(`Erreur lors de la suppression: ${deleteError.message}`);
      }
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;

    try {
      await exportReportToPDF(report);
    } catch (exportError: any) {
      // eslint-disable-next-line no-alert
      alert(`Erreur lors de l'export PDF: ${exportError.message}`);
    }
  };

  // Use centralized permission functions

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

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp3':
      case 'wav':
      case 'm4a':
        return '🎵';
      default:
        return '📎';
    }
  };

  if (!userHasReportsAccess) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Accès Refusé
            </h2>
            <p className="mb-4 text-gray-600">
              Seuls les membres du comité, les leaders et les administrateurs
              peuvent accéder aux rapports.
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-gray-500">Chargement du rapport...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Erreur</h2>
            <p className="mb-4 text-red-500">{error}</p>
            <button
              onClick={() => router.push('/committee/reports')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retour aux rapports
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Rapport non trouvé
            </h2>
            <p className="mb-4 text-gray-500">
              Le rapport demandé n&apos;existe pas.
            </p>
            <button
              onClick={() => router.push('/committee/reports')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retour aux rapports
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/committee/reports')}
            className="mb-4 flex items-center text-blue-600 transition-colors hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" />
            Retour aux rapports
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {report.title}
              </h1>
              <div className="mb-4 flex items-center text-gray-600">
                <FaCalendarAlt className="mr-2" />
                <span>Réunion du {formatDate(report.meetingDate)}</span>
              </div>
            </div>

            <div className="ml-6 flex items-center space-x-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                <FaFilePdf className="mr-2" />
                Exporter PDF
              </button>
              {canEditReport(user, report) && (
                <button
                  onClick={() =>
                    router.push(`/committee/reports/${report.id}/edit`)
                  }
                  className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <FaEdit className="mr-2" />
                  Modifier
                </button>
              )}
              {canDeleteReport(user) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                  <FaTrash className="mr-2" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {report.content}
            </div>
          </div>

          {/* Attachment */}
          {report.attachmentUrl && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaPaperclip className="mr-3 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    Pièce jointe
                  </span>
                  <span className="ml-2 text-lg">
                    {getFileIcon(report.attachmentUrl)}
                  </span>
                </div>
                <a
                  href={report.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div className="flex items-center">
                <FaUser className="mr-2" />
                <span>
                  Créé par:{' '}
                  <span className="font-medium text-gray-900">
                    {report.createdBy
                      ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
                      : 'Membre du Comité'}
                  </span>
                </span>
              </div>
              <div className="flex items-center">
                <FaCalendarAlt className="mr-2" />
                <span>
                  Créé le:{' '}
                  <span className="font-medium text-gray-900">
                    {formatDateTime(report.createdAt)}
                  </span>
                </span>
              </div>
              {report.updatedAt !== report.createdAt && (
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>
                    Modifié le:{' '}
                    <span className="font-medium text-gray-900">
                      {formatDateTime(report.updatedAt)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportDetailPage;
