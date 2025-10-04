import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaPlus,
  FaTrash,
  FaUser,
} from 'react-icons/fa';

import ConfirmationDialog from '@/components/dialog/ConfirmationDialog';
import {
  canDeleteCommunique,
  canEditCommunique,
  hasCommuniquesAccess,
} from '@/lib/communique/permissions';
import { CommuniqueService } from '@/lib/communique/service';
import { useAuth } from '@/providers/AuthProvider';
import type { Communique } from '@/types/communique.types';

import CommuniqueForm from './CommuniqueForm';

const CommuniqueManager: React.FC = () => {
  const { user } = useAuth();
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCommunique, setEditingCommunique] = useState<Communique | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [communiqueToDelete, setCommuniqueToDelete] =
    useState<Communique | null>(null);

  // Check if user has access to communiques management
  const userHasCommuniquesAccess = hasCommuniquesAccess(user);

  const fetchCommuniques = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommuniqueService.getAllCommuniques();
      setCommuniques(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userHasCommuniquesAccess) {
      fetchCommuniques();
    }
  }, [userHasCommuniquesAccess]);

  const handleDelete = async (communique: Communique) => {
    setCommuniqueToDelete(communique);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!communiqueToDelete) return;

    try {
      setDeletingId(communiqueToDelete.id);
      await CommuniqueService.deleteCommunique(communiqueToDelete.id);
      await fetchCommuniques(); // Refresh the list
      setShowDeleteDialog(false);
      setCommuniqueToDelete(null);
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(err.message || 'Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setCommuniqueToDelete(null);
  };

  const handleEdit = (communique: Communique) => {
    setEditingCommunique(communique);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCommunique(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCommunique(null);
    fetchCommuniques(); // Refresh the list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!userHasCommuniquesAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Accès Refusé
          </h2>
          <p className="text-gray-500">
            Seuls les membres du comité, les leaders et les administrateurs
            peuvent gérer les annonces.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement des annonces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2 md:mt-0 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Gestion des Annonces
          </h1>
          <p className="text-gray-600">
            Créez et gérez les annonces de la chorale
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <FaPlus className="mr-0 md:mr-2" />
          <span className="hidden md:block">Nouvelle Annonce</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-blue-600">
            {communiques.length}
          </div>
          <div className="text-sm text-gray-600">Total des Annonces</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-green-600">
            {
              communiques.filter(
                (c) =>
                  new Date(c.createdAt) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Cette Semaine</div>
        </div>
      </div>

      {/* Communiques List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {communiques.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-gray-500">Aucune annonce créée</div>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer la première annonce
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {communiques.map((communique) => (
              <div
                key={communique.id}
                className="p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex flex-col items-start justify-between md:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col justify-between md:mb-0 md:flex-row md:items-center">
                      <Link
                        href={`/announcements/${communique.id}`}
                        className="flex-1 truncate text-left text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
                      >
                        {communique.title}
                      </Link>
                      <div className="ml-0 mt-2 flex items-center text-sm text-gray-500 md:ml-4 md:mt-0">
                        <FaCalendarAlt className="mr-1" />
                        {formatDate(communique.createdAt)}
                      </div>
                    </div>

                    <div className="mb-3 line-clamp-3 text-gray-700">
                      {communique.content}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <FaUser className="mr-1" />
                      {communique.createdBy
                        ? `${communique.createdBy.firstName} ${communique.createdBy.lastName}`
                        : 'Administrateur'}
                    </div>
                  </div>

                  <div className="ml-0 mt-2 flex items-center space-x-2 pt-2 md:ml-4 md:mt-0 md:pt-0">
                    <Link
                      href={`/announcements/${communique.id}`}
                      className="rounded-md p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Voir l'annonce"
                    >
                      <FaEye />
                    </Link>
                    {canEditCommunique(user, communique) && (
                      <button
                        onClick={() => handleEdit(communique)}
                        className="rounded-md p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                    )}
                    {canDeleteCommunique(user, communique) && (
                      <button
                        onClick={() => handleDelete(communique)}
                        disabled={deletingId === communique.id}
                        className="rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === communique.id ? (
                          <div className="size-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <CommuniqueForm
          communique={editingCommunique}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer l'annonce"
        message={`Êtes-vous sûr de vouloir supprimer l'annonce "${communiqueToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deletingId === communiqueToDelete?.id}
      />
    </div>
  );
};

export default CommuniqueManager;
