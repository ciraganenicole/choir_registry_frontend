import Link from 'next/link';
import React from 'react';

import CommuniqueWidget from '@/components/communique/CommuniqueWidget';
import Layout from '@/components/layout';
import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    if (!user) return 'Bienvenue';

    if (user.categories?.includes('LEAD')) {
      return `Bienvenue, ${user.firstName || 'Conducteur'}`;
    }

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return `Bienvenue, ${user.firstName || 'Administrateur'}`;
      case UserRole.FINANCE_ADMIN:
        return `Bienvenue, ${user.firstName || 'Administrateur Financier'}`;
      case UserRole.ATTENDANCE_ADMIN:
        return `Bienvenue, ${user.firstName || 'Administrateur de Présence'}`;
      default:
        return `Bienvenue, ${user.firstName || 'Membre'}`;
    }
  };

  const getDashboardTitle = () => {
    if (!user) return 'Tableau de Bord';

    if (user.categories?.includes('LEAD')) {
      return 'Tableau de Bord - Conducteur';
    }

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return 'Tableau de Bord - Super Administrateur';
      case UserRole.FINANCE_ADMIN:
        return 'Tableau de Bord - Administrateur Financier';
      case UserRole.ATTENDANCE_ADMIN:
        return 'Tableau de Bord - Administrateur de Présence';
      default:
        return 'Tableau de Bord';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getDashboardTitle()}
          </h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()}</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg
                      className="size-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Membres Actifs
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">--</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="rounded-lg bg-green-100 p-2">
                    <svg
                      className="size-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Chants</p>
                    <p className="text-2xl font-semibold text-gray-900">--</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <svg
                      className="size-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Événements
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">--</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Activité Récente
              </h2>
              <div className="py-8 text-center text-gray-500">
                <p>Aucune activité récente</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Announcements Widget */}
            <CommuniqueWidget />

            {/* Quick Actions */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Actions Rapides
              </h2>
              <div className="space-y-3">
                <Link
                  href="/library"
                  className="block w-full rounded-md px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  📚 Bibliothèque Musicale
                </Link>
                <Link
                  href="/rehearsal"
                  className="block w-full rounded-md px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  🎵 Répétitions
                </Link>
                <Link
                  href="/attendance"
                  className="block w-full rounded-md px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  📋 Présence
                </Link>
                {user?.role === UserRole.SUPER_ADMIN && (
                  <Link
                    href="/admin/announcements"
                    className="block w-full rounded-md px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    📢 Gérer les Annonces
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
