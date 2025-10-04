import React from 'react';

import Layout from '@/components/layout';
import { RehearsalErrorBoundary } from '@/components/rehearsal/ErrorBoundary';
import { RehearsalDashboard } from '@/components/rehearsal/RehearsalDashboard';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const RehearsalPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </Layout>
    );
  }

  // Check if user has permission to view rehearsals
  const canViewRehearsals =
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.LEAD ||
    user.role === UserRole.ATTENDANCE_ADMIN ||
    user.categories?.includes(UserCategory.LEAD);

  if (!canViewRehearsals) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Accès refusé
            </h1>
            <p className="text-gray-600">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à
              cette page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <RehearsalErrorBoundary>
          <RehearsalDashboard />
        </RehearsalErrorBoundary>
      </div>
    </Layout>
  );
};

export default RehearsalPage;
