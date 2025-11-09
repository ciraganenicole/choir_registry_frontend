import React from 'react';

import Layout from '@/components/layout';
import { LouadoShiftManager } from '@/components/louado/LouadoShiftManager';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const LouadoPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-600">
            Vous devez être connecté pour consulter le calendrier Louado.
          </p>
        </div>
      </Layout>
    );
  }

  const isAuthorized =
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.LEAD ||
    user.categories?.includes(UserCategory.WORSHIPPER);

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Accès restreint
            </h1>
            <p className="text-gray-600">
              Cette section est réservée à l’équipe Louado.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <LouadoShiftManager />
      </div>
    </Layout>
  );
};

export default LouadoPage;
