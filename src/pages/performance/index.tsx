import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaCheck,
  FaClock,
  FaEdit,
  FaEye,
  FaMapMarkerAlt,
  FaPlay,
  FaRegCalendarAlt,
  FaStar,
  FaTrophy,
  FaUserFriends,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import PerformanceDetail from '@/components/performance/PerformanceDetail';
import PerformanceForm from '@/components/performance/PerformanceForm';
import YearlyPlanningForm from '@/components/performance/YearlyPlanningForm';
import {
  getPerformanceStatusColor,
  getPerformanceStatusLabel,
  getPerformanceTypeColor,
  usePerformances,
  usePerformanceStats,
  useUnassignedPerformances,
} from '@/lib/performance/logic';
import type {
  CreatePerformanceDto,
  Performance,
  PerformanceFilterDto,
  UpdatePerformanceDto,
} from '@/lib/performance/types';
import { PerformanceStatus, PerformanceType } from '@/lib/performance/types';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useUsers } from '@/lib/user/useUsers';
import { useAuth } from '@/providers/AuthProvider';

const PerformancePage = () => {
  const { user } = useAuth();
  const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [showYearlyPlanning, setShowYearlyPlanning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPerformance, setSelectedPerformance] =
    useState<Performance | null>(null);
  const [editingPerformance, setEditingPerformance] =
    useState<Performance | null>(null);
  const [assigningPerformance, setAssigningPerformance] =
    useState<Performance | null>(null);

  // Filter state
  const [filters, setFilters] = useState<PerformanceFilterDto>({});

  // Remove client-side pagination - using server-side pagination from usePerformances hook

  // Check if user can manage performances (SUPER_ADMIN and LEAD users)
  const canManagePerformances =
    user?.role === UserRole.SUPER_ADMIN ||
    user?.categories?.includes(UserCategory.LEAD);

  // Check if user is admin (SUPER_ADMIN only for admin features like assignment and yearly planning)
  const isAdmin = user?.role === UserRole.SUPER_ADMIN;

  const {
    performances,
    loading,
    error,
    total,
    pagination,
    fetchPerformances,
    createPerformance,
    updatePerformance,
  } = usePerformances();
  const { stats, loading: statsLoading } = usePerformanceStats();
  useUnassignedPerformances();
  const { users } = useUsers();

  useEffect(() => {
    fetchPerformances(filters);
  }, [filters, fetchPerformances]); // Fetch performances when filters change

  // Use server-side pagination data directly
  const currentPerformances = performances; // Server already returns the correct page
  const totalPages = pagination.totalPages;

  const handlePageChange = useCallback(
    (page: number) => {
      // Update server-side pagination by calling fetchPerformances with new page
      fetchPerformances(filters, { page, limit: 10 }); // Use the same limit as the hook
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchPerformances, filters],
  );

  // Memoize stats calculation
  const calculatedStats = useMemo(
    () => ({
      upcoming: performances.filter((p) => p.status === 'upcoming').length,
      inPreparation: performances.filter((p) => p.status === 'in_preparation')
        .length,
      ready: performances.filter((p) => p.status === 'ready').length,
      completed: performances.filter((p) => p.status === 'completed').length,
      total: performances.length,
    }),
    [performances],
  );

  // Memoize performance stats array
  const performanceStats = useMemo(
    () => [
      {
        label: 'À Venir',
        value: stats?.upcomingPerformances ?? calculatedStats.upcoming,
        icon: <FaStar className="ml-2 text-sm text-blue-400 md:text-xl" />,
      },
      {
        label: 'Préparation',
        value:
          stats?.inPreparationPerformances ?? calculatedStats.inPreparation,
        icon: <FaClock className="ml-2 text-sm text-yellow-400 md:text-xl" />,
      },
      {
        label: 'Prêtes',
        value: stats?.readyPerformances ?? calculatedStats.ready,
        icon: <FaPlay className="ml-2 text-sm text-green-400 md:text-xl" />,
      },
      {
        label: 'Terminées',
        value: stats?.completedPerformances ?? calculatedStats.completed,
        icon: <FaCheck className="ml-2 text-sm text-orange-400 md:text-xl" />,
      },
      {
        label: 'Total',
        value: stats?.totalPerformances ?? calculatedStats.total,
        icon: <FaTrophy className="ml-2 text-sm text-orange-400 md:text-xl" />,
      },
    ],
    [stats, calculatedStats],
  );

  const handleViewPerformanceDetail = (performance: Performance) => {
    setSelectedPerformance(performance);
    setShowPerformanceDetail(true);
  };

  const handleClosePerformanceDetail = () => {
    setShowPerformanceDetail(false);
    setSelectedPerformance(null);
  };

  const handleCreatePerformance = () => {
    setEditingPerformance(null);
    setShowPerformanceForm(true);
  };

  const handleEditPerformance = (performance: Performance) => {
    setEditingPerformance(performance);
    setShowPerformanceForm(true);
  };

  const handleClosePerformanceForm = () => {
    setShowPerformanceForm(false);
    setEditingPerformance(null);
  };

  const handleYearlyPlanning = () => {
    setShowYearlyPlanning(true);
  };

  const handleCloseYearlyPlanning = () => {
    setShowYearlyPlanning(false);
  };

  const handleRefreshData = () => {
    fetchPerformances(filters);
  };

  const handleFilterChange = (newFilters: Partial<PerformanceFilterDto>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Get available shift leads (users with LEAD category or SUPER_ADMIN role only)
  const availableShiftLeads = useMemo(() => {
    return users.filter(
      (u) =>
        u.categories?.includes(UserCategory.LEAD) ||
        u.role === UserRole.SUPER_ADMIN,
    );
  }, [users]);

  const handleAssignPerformance = (performance: Performance) => {
    setAssigningPerformance(performance);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssigningPerformance(null);
  };

  const handleAssignToShiftLead = async (shiftLeadId: number) => {
    if (!assigningPerformance) return;

    try {
      // Use updatePerformance to update the main performances list
      await updatePerformance(assigningPerformance.id, {
        shiftLeadId,
      });
      handleCloseAssignModal();
      // No need to refetch - updatePerformance already updates local state
    } catch (err) {
      toast.error("Échec de l'assignation de la performance");
    }
  };

  const handleSubmitPerformance = async (
    data: CreatePerformanceDto | UpdatePerformanceDto,
  ) => {
    try {
      if (editingPerformance) {
        await updatePerformance(
          editingPerformance.id,
          data as UpdatePerformanceDto,
        );
      } else {
        await createPerformance(data as CreatePerformanceDto);
      }
      handleClosePerformanceForm();
    } catch (submitError) {
      // Silently ignore performance form submission errors - UI will reflect current state
    }
  };

  const getStatusBadge = (status: PerformanceStatus) => {
    const colorClass = getPerformanceStatusColor(status);
    const label = getPerformanceStatusLabel(status);

    return (
      <span
        className={`mr-2 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  const getPerformanceTypeLabel = (type: string) => {
    const typeTranslations: Record<string, string> = {
      Concert: 'Concert',
      'Worship Service': 'Service de Culte',
      'Sunday Service': 'Service du Dimanche',
      'Special Event': 'Événement Spécial',
      Rehearsal: 'Répétition',
      Wedding: 'Mariage',
      Funeral: 'Funérailles',
      Other: 'Autre',
    };
    return typeTranslations[type] || type;
  };

  const getTypeBadge = (type: PerformanceType) => {
    const colorClass = getPerformanceTypeColor(type);

    return (
      <span
        className={`mr-2 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
      >
        {getPerformanceTypeLabel(type)}
      </span>
    );
  };

  const getAssignmentBadge = (performance: Performance) => {
    if (performance.shiftLeadId && performance.shiftLead) {
      return (
        <span className="mr-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          ✅ Assigné à {performance.shiftLead.firstName}{' '}
          {performance.shiftLead.lastName}
        </span>
      );
    }
    return (
      <span className="mr-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
        ⚠️ Non assigné
      </span>
    );
  };

  const getWorkflowActions = (performance: Performance) => {
    const actions: React.ReactElement[] = [];

    // Only show workflow actions for users who can manage this performance
    // SUPER_ADMIN can manage all, LEAD users can only manage performances assigned to them
    if (
      !canManagePerformances ||
      (user?.categories?.includes(UserCategory.LEAD) &&
        performance.shiftLeadId !== user?.id)
    ) {
      return actions;
    }

    switch (performance.status) {
      case 'upcoming':
        actions.push(
          <button
            type="button"
            key="mark-preparation"
            onClick={async () => {
              try {
                await updatePerformance(performance.id, {
                  status: PerformanceStatus.IN_PREPARATION,
                });
                // No need to refetch - updatePerformance already updates local state
              } catch (updateError) {
                // Silently ignore performance status update errors - UI will reflect current state
              }
            }}
            className="flex items-center gap-1 rounded-md bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 sm:gap-2 sm:px-4"
          >
            <FaClock /> Prêt pour répétitions
          </button>,
        );
        break;

      case 'ready':
        actions.push(
          <button
            type="button"
            key="mark-completed"
            onClick={async () => {
              try {
                await updatePerformance(performance.id, {
                  status: PerformanceStatus.COMPLETED,
                });
                // No need to refetch - updatePerformance already updates local state
              } catch (completeError) {
                // Silently ignore performance completion errors - UI will reflect current state
              }
            }}
            className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 sm:gap-2 sm:px-4"
          >
            <FaCheck /> Marquer terminé
          </button>,
        );
        break;

      default:
        // No actions for unknown status
        break;
    }

    return actions;
  };

  if (loading || statsLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Chargement des performances...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-red-600">Erreur : {error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 md:text-2xl">
              Gestion des Performances
            </h1>
            <p className="text-xs text-gray-500 md:text-sm">
              Suivez le workflow des performances : Création → Répétitions →
              Exécution → Achèvement
            </p>
          </div>
          {canManagePerformances && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreatePerformance}
                className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 sm:px-6 sm:text-base md:self-auto"
              >
                + Créer une Performance
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleYearlyPlanning}
                  className="flex items-center gap-2 self-start rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 sm:px-6 sm:text-base md:self-auto"
                >
                  📅 Planification Annuelle
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 md:mb-8 md:grid-cols-5 md:gap-4">
          {performanceStats.map((stat) => (
            <Card key={stat.label} className="border-l-4 border-orange-400">
              <CardContent>
                <div className="flex flex-row items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center text-[12px] font-medium text-gray-500 md:text-sm">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                      {stat.value}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Type Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) =>
                  handleFilterChange({
                    type: (e.target.value as PerformanceType) || undefined,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                {Object.values(PerformanceType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  handleFilterChange({
                    status: (e.target.value as PerformanceStatus) || undefined,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {Object.values(PerformanceStatus).map((status) => (
                  <option key={status} value={status}>
                    {getPerformanceStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Lead Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Conducteur
              </label>
              <select
                value={filters.shiftLeadId || ''}
                onChange={(e) =>
                  handleFilterChange({
                    shiftLeadId: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les conducteurs</option>
                {availableShiftLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  const date = e.target.value;
                  // Try startDate/endDate as fallback since date parameter might not be supported yet
                  handleFilterChange({
                    startDate: date || undefined,
                    endDate: date || undefined, // Set both to same date for single-day filtering
                    date: undefined, // Clear date parameter
                  });
                }}
                placeholder="jj/mm/aaaa"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm md:p-4">
          {currentPerformances.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucune performance trouvée. Créez votre première performance pour
              commencer.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {currentPerformances.map((perf) => (
                <div
                  key={perf.id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-400 p-3 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                      <span className="text-lg font-bold text-gray-900 sm:text-xl">
                        {getPerformanceTypeLabel(perf.type)}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {getStatusBadge(perf.status)}
                        {getTypeBadge(perf.type)}
                        {getAssignmentBadge(perf)}
                      </div>
                    </div>
                    <div className="mb-2 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                      <div className="flex items-center gap-2">
                        <FaRegCalendarAlt className="text-gray-400" />
                        {new Date(perf.date).toLocaleDateString()}
                      </div>
                      {perf.location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-gray-400" />
                          {perf.location}
                        </div>
                      )}
                      {perf.expectedAudience && (
                        <div className="flex items-center gap-2">
                          <FaUserFriends className="text-gray-400" />
                          Public attendu : {perf.expectedAudience}
                        </div>
                      )}
                      {perf.shiftLead && (
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-gray-400" />
                          Conducteur : {perf.shiftLead.firstName}{' '}
                          {perf.shiftLead.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 md:items-center md:justify-end">
                    {getWorkflowActions(perf)}

                    {/* Assign button for unassigned performances - Admin only */}
                    {(!perf.shiftLeadId || !perf.shiftLead) && isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleAssignPerformance(perf)}
                        className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 sm:gap-2 sm:px-4"
                      >
                        <FaUserPlus className="text-white" />
                        <span className="hidden sm:inline">Assigner</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleViewPerformanceDetail(perf)}
                      className="flex items-center gap-1 rounded-md border border-gray-400 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:gap-2 sm:px-4"
                    >
                      <FaEye className="text-gray-400" />
                      <span className="hidden sm:inline">Détails</span>
                      <span className="sm:hidden">Détails</span>
                    </button>
                    {canManagePerformances &&
                      perf.status !== PerformanceStatus.COMPLETED &&
                      // LEAD users can only edit performances assigned to them, SUPER_ADMIN can edit all
                      (user?.role === UserRole.SUPER_ADMIN ||
                        (user?.categories?.includes(UserCategory.LEAD) &&
                          perf.shiftLeadId === user?.id)) && (
                        <button
                          type="button"
                          onClick={() => handleEditPerformance(perf)}
                          className="flex items-center gap-1 rounded-md border border-gray-400 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:gap-2 sm:px-4"
                        >
                          <FaEdit className="text-gray-400" />
                          <span className="hidden sm:inline">Modifier</span>
                          <span className="sm:hidden">Modifier</span>
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          {/* Performance count and pagination info */}
          <div className="mb-4 text-center text-sm text-gray-600">
            {loading ? (
              <span>Chargement...</span>
            ) : (
              <span>
                Affichage de {performances.length} performance
                {performances.length > 1 ? 's' : ''} sur {total} au total
                {totalPages > 1 &&
                  ` - Page ${pagination.page} sur ${totalPages}`}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {showPerformanceDetail && selectedPerformance && (
          <PerformanceDetail
            performance={selectedPerformance}
            onClose={handleClosePerformanceDetail}
            onSuccess={() => {
              handleClosePerformanceDetail();
              fetchPerformances();
            }}
          />
        )}

        {showPerformanceForm && (
          <PerformanceForm
            performance={editingPerformance || undefined}
            onSubmit={handleSubmitPerformance}
            onCancel={handleClosePerformanceForm}
            loading={loading}
          />
        )}

        {showYearlyPlanning && (
          <YearlyPlanningForm
            onClose={handleCloseYearlyPlanning}
            onSuccess={handleRefreshData}
          />
        )}

        {/* Assignment Modal */}
        {showAssignModal && assigningPerformance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Assigner une Performance à un Conducteur
                </h2>
                <button
                  onClick={handleCloseAssignModal}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    {getPerformanceTypeLabel(assigningPerformance.type)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(assigningPerformance.date).toLocaleDateString(
                      'fr-FR',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </p>
                  {assigningPerformance.location && (
                    <p className="text-sm text-gray-600">
                      📍 {assigningPerformance.location}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assigner à un Conducteur
                  </label>
                  <select
                    id="shiftLeadSelect"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un conducteur</option>
                    {availableShiftLeads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={handleCloseAssignModal}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const selectElement = document.getElementById(
                        'shiftLeadSelect',
                      ) as HTMLSelectElement;
                      const selectedId = parseInt(selectElement.value, 10);
                      if (selectedId) {
                        handleAssignToShiftLead(selectedId);
                      } else {
                        toast.error('Veuillez sélectionner un conducteur');
                      }
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    Assigner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PerformancePage;
