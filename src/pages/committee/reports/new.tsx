import { useRouter } from 'next/router';
import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

import Layout from '@/components/layout';
import ReportForm from '@/components/report/ReportForm';
import { hasReportsAccess } from '@/lib/report/permissions';
import { useAuth } from '@/providers/AuthProvider';

const NewReportPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Check if user has access to reports
  const userHasReportsAccess = hasReportsAccess(user);

  const handleFormSuccess = () => {
    router.push('/committee/reports');
  };

  const handleFormClose = () => {
    router.push('/committee/reports');
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
              peuvent créer des rapports.
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

          <h1 className="text-3xl font-bold text-gray-900">Nouveau Rapport</h1>
          <p className="mt-2 text-gray-600">
            Créez un nouveau rapport de réunion du comité
          </p>
        </div>

        {/* Form */}
        <ReportForm
          report={null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </div>
    </Layout>
  );
};

export default NewReportPage;
