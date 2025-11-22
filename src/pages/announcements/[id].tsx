import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEdit,
  FaFilePdf,
  FaTrash,
} from 'react-icons/fa';

import Layout from '@/components/layout';
import {
  canDeleteCommunique,
  canEditCommunique,
  hasCommuniquesAccess,
} from '@/lib/communique/permissions';
import { CommuniqueService } from '@/lib/communique/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Communique } from '@/types/communique.types';

const CommuniqueDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [communique, setCommunique] = useState<Communique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to communiques
  const userHasCommuniquesAccess = hasCommuniquesAccess(user);

  const fetchCommunique = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommuniqueService.getCommuniqueById(Number(id));
      setCommunique(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCommunique();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!communique) return;

    // eslint-disable-next-line no-alert
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.',
      )
    ) {
      try {
        await CommuniqueService.deleteCommunique(communique.id);
        router.push('/announcements');
      } catch (deleteError: any) {
        // eslint-disable-next-line no-alert
        alert(`Erreur lors de la suppression: ${deleteError.message}`);
      }
    }
  };

  const handleExportPDF = async () => {
    if (!communique) return;

    try {
      // Import the PDF export function dynamically
      const { exportCommuniqueToPDF } = await import(
        '@/lib/communique/pdf-export'
      );
      await exportCommuniqueToPDF(communique);
    } catch (exportError: any) {
      // eslint-disable-next-line no-alert
      alert(`Erreur lors de l'export PDF: ${exportError.message}`);
    }
  };

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

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-gray-500">Chargement de l&apos;annonce...</div>
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
              onClick={() => router.push('/announcements')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retour aux annonces
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!communique) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Annonce non trouvée
            </h2>
            <p className="mb-4 text-gray-500">
              L&apos;annonce demandée n&apos;existe pas.
            </p>
            <button
              onClick={() => router.push('/announcements')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retour aux annonces
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
            onClick={() => router.push('/announcements')}
            className="my-4 flex items-center text-blue-600 transition-colors hover:text-blue-800 md:mt-0"
          >
            <FaArrowLeft className="mr-2" />
            Retour aux annonces
          </button>

          <div className="flex flex-col items-start justify-between md:flex-row">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {communique.title}
              </h1>
              <div className="mb-4 flex items-center text-gray-600">
                <FaCalendarAlt className="mr-2" />
                <span>Publié le {formatDate(communique.createdAt)}</span>
              </div>
            </div>

            <div className="ml-0 flex items-center space-x-3 md:ml-6">
              <button
                onClick={handleExportPDF}
                className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                <FaFilePdf className="mr-2" />
                Exporter
              </button>
              {userHasCommuniquesAccess &&
                canEditCommunique(user, communique) && (
                  <button
                    onClick={() =>
                      router.push(`/admin/announcements/${communique.id}/edit`)
                    }
                    className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    <FaEdit className="mr-2" />
                    Modifier
                  </button>
                )}
              {userHasCommuniquesAccess &&
                canDeleteCommunique(user, communique) && (
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
              {communique.content}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaCalendarAlt className="mr-2" />
                <span>
                  Publié le:{' '}
                  <span className="font-medium text-gray-900">
                    {formatDateTime(communique.createdAt)}
                  </span>
                </span>
              </div>
              {communique.updatedAt !== communique.createdAt && (
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>
                    Modifié le:{' '}
                    <span className="font-medium text-gray-900">
                      {formatDateTime(communique.updatedAt)}
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

export default CommuniqueDetailPage;
