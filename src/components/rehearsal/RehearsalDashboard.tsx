import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaCalendar,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaMusic,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import { useRehearsals } from '@/lib/rehearsal/logic';
import { RehearsalService } from '@/lib/rehearsal/service';
import type {
  Rehearsal,
  RehearsalStatus,
  RehearsalType,
} from '@/lib/rehearsal/types';
import { UserCategory } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

import { RehearsalDetail } from './RehearsalDetail';
import { RehearsalForm } from './RehearsalForm';
import { RehearsalStatusUpdater } from './RehearsalStatusUpdater';
import { RehearsalTemplateManager } from './RehearsalTemplateManager';

interface RehearsalDashboardProps {
  performanceId?: number;
  showCreateButton?: boolean;
}

export const RehearsalDashboard: React.FC<RehearsalDashboardProps> = ({
  performanceId,
  showCreateButton = true,
}) => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(
    null,
  );
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(
    null,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rehearsalToDelete, setRehearsalToDelete] = useState<Rehearsal | null>(
    null,
  );
  const [filters, setFilters] = useState<{
    search: string;
    type: RehearsalType | '';
    status: RehearsalStatus | '';
    page: number;
    limit: number;
  }>({
    search: '',
    type: '',
    status: '',
    page: 1,
    limit: 10,
  });

  const {
    rehearsals = [],
    error,
    fetchRehearsals,
    total = 0,
    pagination,
    isLoading,
  } = useRehearsals({
    ...filters,
    type: filters.type || undefined,
    status: filters.status || undefined,
    performanceId,
  });

  // Rehearsals are automatically fetched by the useRehearsals hook

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchRehearsals(); // Refresh the list
  };

  const handleRehearsalSelect = (rehearsal: Rehearsal) => {
    setSelectedRehearsal(rehearsal);
  };

  const handleCloseDetail = () => {
    setSelectedRehearsal(null);
  };

  const handleEditRehearsal = (rehearsal: Rehearsal) => {
    setEditingRehearsal(rehearsal);
    setShowEditForm(true);
  };

  const handleCloseEdit = () => {
    setEditingRehearsal(null);
    setShowEditForm(false);
  };

  const handleDeleteRehearsal = (rehearsal: Rehearsal) => {
    setRehearsalToDelete(rehearsal);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRehearsal = async () => {
    if (!rehearsalToDelete) return;

    try {
      await RehearsalService.deleteRehearsal(rehearsalToDelete.id);

      // Refresh the list
      fetchRehearsals();

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setRehearsalToDelete(null);
    } catch (deleteError: any) {
      toast.error(`Erreur lors de la suppression: ${deleteError.message}`);
    }
  };

  const cancelDeleteRehearsal = () => {
    setShowDeleteDialog(false);
    setRehearsalToDelete(null);
  };

  const handleStatusChange = (
    rehearsalId: number,
    newStatus: RehearsalStatus,
  ) => {
    // Refresh the rehearsals list to get updated data
    fetchRehearsals();

    // If the selected rehearsal is the one being updated, update it too
    if (selectedRehearsal?.id === rehearsalId) {
      setSelectedRehearsal((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  const getStatusLabel = (status: RehearsalStatus) => {
    switch (status) {
      case 'Planning':
        return 'Planifiée';
      case 'In Progress':
        return 'En cours';
      case 'Completed':
        return 'Terminée';
      case 'Cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: RehearsalType) => {
    switch (type) {
      case 'General Practice':
        return 'Pratique Générale';
      case 'Performance Preparation':
        return 'Préparation Performance';
      case 'Song Learning':
        return 'Apprentissage Chansons';
      case 'Sectional Practice':
        return 'Répétition Sectionnelle';
      case 'Full Ensemble':
        return 'Répétition Générale';
      case 'Dress Rehearsal':
        return 'Choreographie';
      default:
        return type;
    }
  };

  // Memoize rehearsal list with formatted data to avoid recalculating on every render
  const rehearsalsWithFormattedData = useMemo(() => {
    return (rehearsals || []).map((rehearsal) => {
      const rehearsalDate = new Date(rehearsal.date);

      return {
        ...rehearsal,
        formattedDate: rehearsalDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        formattedTime: rehearsalDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        formattedDuration: rehearsal.duration
          ? `${rehearsal.duration} minutes`
          : 'Non spécifié',
        statusLabel: getStatusLabel(rehearsal.status),
        typeLabel: getTypeLabel(rehearsal.type),
      };
    });
  }, [rehearsals]);

  // Memoize filter reset handler
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      status: '',
      page: 1,
      limit: 10,
    });
  }, []);

  // Memoize filter change handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value as RehearsalType | '',
      page: 1,
    }));
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as RehearsalStatus | '',
      page: 1,
    }));
  }, []);

  // Check if user can create/edit rehearsals (only lead category users)
  const canManageRehearsals = user?.categories?.includes(UserCategory.LEAD);

  if (showCreateForm) {
    return (
      <div className="">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une répétition
          </h1>
          <button
            onClick={() => setShowCreateForm(false)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
          >
            Annuler
          </button>
        </div>
        <RehearsalForm
          performanceId={performanceId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (showEditForm && editingRehearsal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier la répétition
          </h1>
          <button
            onClick={handleCloseEdit}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
          >
            Annuler
          </button>
        </div>
        <RehearsalForm
          rehearsal={editingRehearsal}
          performanceId={performanceId}
          onSuccess={() => {
            handleCloseEdit();
            fetchRehearsals(); // Refresh the list
          }}
          onCancel={handleCloseEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rehearsal Detail Popup */}
      {selectedRehearsal &&
        (() => {
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={handleCloseDetail}
            >
              <div
                className="size-full overflow-y-auto rounded-lg bg-white shadow-xl md:h-[98vh] md:w-[80%]"
                onClick={(e) => e.stopPropagation()}
              >
                <RehearsalDetail
                  rehearsal={selectedRehearsal}
                  onDelete={() => {
                    handleDeleteRehearsal(selectedRehearsal);
                  }}
                  onClose={handleCloseDetail}
                  onStatusChange={(newStatus) =>
                    handleStatusChange(selectedRehearsal.id, newStatus)
                  }
                />
              </div>
            </div>
          );
        })()}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 md:text-3xl">
            Répétitions
          </h1>
          <p className="text-[14px] text-gray-600 md:text-base">
            Gérez et suivez vos répétitions
          </p>
        </div>

        {showCreateButton && canManageRehearsals && (
          <div className="flex gap-2">
            {/* <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Utiliser un modèle</span>
              <span className="sm:hidden">Modèle</span>
            </button> */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 md:px-4 md:py-3"
            >
              <FaPlus />
              <span className="hidden sm:inline">Nouvelle répétition</span>
              <span className="sm:hidden">Nouvelle</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 md:p-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une répétition..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-400 bg-gray-50 py-3 pl-12 pr-4 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-row gap-3">
          {/* Type Filter */}
          <div className="flex-1">
            <select
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-gray-50 px-2 py-1 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 md:rounded-xl md:px-4 md:py-3"
            >
              <option value="">Types</option>
              <option value="General Practice">Pratique Générale</option>
              <option value="Performance Preparation">
                Préparation Performance
              </option>
              <option value="Song Learning">Apprentissage Chansons</option>
              <option value="Sectional Practice">
                Répétition Sectionnelle
              </option>
              <option value="Full Ensemble">Ensemble Complet</option>
              <option value="Dress Rehearsal">Répétition Générale</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-gray-50 px-2 py-1 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 md:rounded-xl md:px-4 md:py-3"
            >
              <option value="">Statuts</option>
              <option value="Planning">Planifiée</option>
              <option value="In Progress">En cours</option>
              <option value="Completed">Terminée</option>
              <option value="Cancelled">Annulée</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-[14px] font-medium text-gray-600 transition-all duration-200 hover:bg-gray-200 md:rounded-xl md:px-6 md:py-3 md:text-[16px]"
            >
              <FaFilter className="text-sm" />
              <span className="hidden sm:inline">Réinitialiser</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.type || filters.status) && (
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-2 text-sm md:text-base">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 md:text-base">
                Recherche: &quot;{filters.search}&quot;
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, search: '', page: 1 }))
                  }
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 md:text-base">
                Type: {getTypeLabel(filters.type as RehearsalType)}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, type: '', page: 1 }))
                  }
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 md:text-base">
                Statut: {getStatusLabel(filters.status as RehearsalStatus)}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: '', page: 1 }))
                  }
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rehearsal List */}
      <div className="">
        {(() => {
          if (error) {
            return (
              <div className="m-4 rounded-xl bg-white p-8 text-center text-sm md:text-base">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50">
                  <FaExclamationTriangle className="size-8 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Erreur lors du chargement
                </h3>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            );
          }

          if (isLoading) {
            return (
              <div className="m-4 rounded-xl bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="size-8 animate-spin text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Chargement des répétitions...
                </h3>
                <p className="text-sm text-gray-500">Veuillez patienter</p>
              </div>
            );
          }

          if (!rehearsals || rehearsals.length === 0) {
            return (
              <div className="m-4 rounded-xl bg-white p-8 text-center text-sm md:text-base">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                  <FaMusic className="size-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Aucune répétition trouvée
                </h3>
                <p className="text-sm text-gray-500">
                  {(() => {
                    if (filters.search || filters.type || filters.status) {
                      return 'Essayez de modifier vos filtres';
                    }
                    return 'Commencez par créer votre première répétition';
                  })()}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-2 text-sm md:space-y-4 md:text-base">
              {rehearsalsWithFormattedData.map((rehearsal) => (
                <div
                  key={rehearsal.id}
                  className="overflow-hidden rounded-xl border border-gray-400 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3 text-sm md:text-base">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-2 text-lg font-semibold text-gray-900">
                          {rehearsal.title}
                        </h3>
                      </div>
                      <RehearsalStatusUpdater
                        rehearsalId={rehearsal.id}
                        currentStatus={rehearsal.status}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(rehearsal.id, newStatus)
                        }
                        size="sm"
                      />
                    </div>

                    {/* Card Details - Mobile Optimized */}
                    <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:py-4">
                      {/* Date Row */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <FaCalendar className="text-sm text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 md:text-base">
                            {rehearsal.formattedDate}
                          </p>
                          <p className="text-xs text-gray-500 md:text-sm">
                            {rehearsal.formattedTime}
                          </p>
                        </div>
                      </div>

                      {/* Location Row */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
                          <FaUsers className="text-sm text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 md:text-base">
                            {rehearsal.location || 'Lieu non défini'}
                          </p>
                          <p className="text-xs text-gray-500 md:text-sm">
                            Lieu de répétition
                          </p>
                        </div>
                      </div>

                      {/* Type and Songs Row */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                          <FaMusic className="text-sm text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 md:text-base">
                            {rehearsal.typeLabel}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const songCount =
                                rehearsal.rehearsalSongs?.length || 0;
                              return `${songCount} chanson${songCount > 1 ? 's' : ''}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="border-t border-gray-100 bg-blue-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRehearsalSelect(rehearsal)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                          title="Voir les détails"
                        >
                          <FaEye className="text-sm" />
                          <span className="hidden sm:inline">Voir</span>
                        </button>
                        {canManageRehearsals && (
                          <button
                            onClick={() => handleEditRehearsal(rehearsal)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                            title="Modifier"
                          >
                            <FaEdit className="text-sm" />
                            <span className="hidden sm:inline">Modifier</span>
                          </button>
                        )}
                      </div>
                      {canManageRehearsals && (
                        <button
                          onClick={() => handleDeleteRehearsal(rehearsal)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          title="Supprimer"
                        >
                          <FaTrash className="text-sm" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Enhanced Pagination */}
      {total && total > filters.limit && (
        <div className="space-y-2">
          {/* Pagination Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs text-blue-700">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div>
                  <span className="font-medium">Page:</span> {pagination.page} /{' '}
                  {pagination.totalPages}
                </div>
                <div>
                  <span className="font-medium">Limite:</span>{' '}
                  {pagination.limit} par page
                </div>
                <div>
                  <span className="font-medium">Total:</span> {total}{' '}
                  répétitions
                </div>
                <div>
                  <span className="font-medium">Navigation:</span>
                  {pagination.hasPrev ? ' ←' : ''}
                  {pagination.hasNext ? ' →' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-700">
              Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
              {Math.min(pagination.page * pagination.limit, total)} sur {total}{' '}
              répétitions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={!pagination.hasPrev}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-2 text-gray-700">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={!pagination.hasNext}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
          <div className="h-[98vh] w-full overflow-y-auto rounded-lg bg-white md:w-[80%]">
            <div className="p-6">
              <RehearsalTemplateManager
                performanceId={performanceId}
                onCreateNewRehearsal={() => {
                  setShowTemplateModal(false);
                  setShowCreateForm(true);
                }}
                onClose={() => setShowTemplateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && rehearsalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-center">
          <div className="w-[90%] rounded-lg bg-white p-6 shadow-xl md:w-[500px]">
            <h3 className="text-xl font-bold text-gray-900">
              Confirmer la suppression
            </h3>
            <p className="py-4 text-[16px] font-medium">
              Cette action est irréversible. La répétition et toutes ses données
              associées seront définitivement supprimées.
            </p>

            <div className="flex items-center justify-center gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={cancelDeleteRehearsal}
                className="rounded-md bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteRehearsal}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <FaTrash />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
