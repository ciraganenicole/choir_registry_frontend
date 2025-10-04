import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

import Layout from '@/components/layout';
import ReportForm from '@/components/report/ReportForm';
import { canEditReport, hasReportsAccess } from '@/lib/report/permissions';
import { ReportService } from '@/lib/report/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Report } from '@/types/report.types';

const EditReportPage: React.FC = () => {
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

  const handleFormSuccess = () => {
    router.push(`/committee/reports/${id}`);
  };

  const handleFormClose = () => {
    router.push(`/committee/reports/${id}`);
  };

  // Use centralized permission functions

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
              peuvent modifier des rapports.
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

  if (!canEditReport(user, report)) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Permission Refusée
            </h2>
            <p className="mb-4 text-gray-600">
              Vous ne pouvez modifier que les rapports que vous avez créés.
            </p>
            <button
              onClick={() => router.push(`/committee/reports/${report.id}`)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Voir le rapport
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
            onClick={() => router.push(`/committee/reports/${report.id}`)}
            className="mb-4 flex items-center text-blue-600 transition-colors hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" />
            Retour au rapport
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Modifier le Rapport
          </h1>
          <p className="mt-2 text-gray-600">
            Modifiez les informations du rapport de réunion
          </p>
        </div>

        {/* Form */}
        <ReportForm
          report={report}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </div>
    </Layout>
  );
};

export default EditReportPage;
