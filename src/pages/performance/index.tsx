import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import PerformanceDetail from '@/components/performance/PerformanceDetail';
import PerformanceForm from '@/components/performance/PerformanceForm';
import {
  getPerformanceStatusColor,
  getPerformanceStatusLabel,
  getPerformanceTypeColor,
  usePerformances,
  usePerformanceStats,
} from '@/lib/performance/logic';
import type {
  CreatePerformanceDto,
  Performance,
  PerformanceType,
  UpdatePerformanceDto,
} from '@/lib/performance/types';
import { PerformanceStatus } from '@/lib/performance/types';
import { UserCategory } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const PerformancePage = () => {
  const { user } = useAuth();
  const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [selectedPerformance, setSelectedPerformance] =
    useState<Performance | null>(null);
  const [editingPerformance, setEditingPerformance] =
    useState<Performance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const performancesPerPage = 8;

  // Check if user can manage performances (only lead category users)
  const canManagePerformances = user?.categories?.includes(UserCategory.LEAD);

  const {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
    updatePerformance,
  } = usePerformances();
  const { stats, loading: statsLoading } = usePerformanceStats();

  useEffect(() => {
    fetchPerformances();
  }, []); // ✅ FIXED: Only run once on mount, not on every fetchPerformances change

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(performances.length / performancesPerPage);
    const startIndex = (currentPage - 1) * performancesPerPage;
    const endIndex = startIndex + performancesPerPage;
    const currentPerformances = performances.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentPerformances };
  }, [performances, currentPage, performancesPerPage]);

  const { totalPages, currentPerformances } = paginationData;

  useEffect(() => {
    setCurrentPage(1);
  }, [performances.length]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      console.warn('Failed to submit performance form:', submitError);
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

  const getTypeBadge = (type: PerformanceType) => {
    const colorClass = getPerformanceTypeColor(type);

    return (
      <span
        className={`mr-2 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
      >
        {type}
      </span>
    );
  };

  const getWorkflowActions = (performance: Performance) => {
    const actions: React.ReactElement[] = [];

    // Only show workflow actions for lead users
    if (!canManagePerformances) {
      return actions;
    }

    switch (performance.status) {
      case 'upcoming':
        actions.push(
          <button
            key="mark-preparation"
            onClick={async () => {
              try {
                await updatePerformance(performance.id, {
                  status: PerformanceStatus.IN_PREPARATION,
                });
                fetchPerformances();
              } catch (updateError) {
                // Silently ignore performance status update errors - UI will reflect current state
                console.warn(
                  'Failed to update performance status:',
                  updateError,
                );
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
            key="mark-completed"
            onClick={async () => {
              try {
                await updatePerformance(performance.id, {
                  status: PerformanceStatus.COMPLETED,
                });
                fetchPerformances();
              } catch (completeError) {
                // Silently ignore performance completion errors - UI will reflect current state
                console.warn('Failed to complete performance:', completeError);
              }
            }}
            className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 sm:gap-2 sm:px-4"
          >
            <FaCheck /> Marquer terminé
          </button>,
        );
        break;

      case 'completed':
        actions.push(
          <button
            key="view-details"
            onClick={() => handleViewPerformanceDetail(performance)}
            className="flex items-center gap-1 rounded-md bg-gray-500 px-3 py-1 text-sm font-medium text-white hover:bg-gray-600 sm:gap-2 sm:px-4"
          >
            <FaEye /> Voir détails
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
              Liste des Performances
            </h1>
            <p className="text-xs text-gray-500 md:text-sm">
              Suivez le workflow des performances : Création → Répétitions →
              Exécution → Achèvement
            </p>
          </div>
          {canManagePerformances && (
            <button
              onClick={handleCreatePerformance}
              className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 sm:px-6 sm:text-base md:self-auto"
            >
              + Créer Performance
            </button>
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
                        Performance {perf.type}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {getStatusBadge(perf.status)}
                        {getTypeBadge(perf.type)}
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
                          Chef : {perf.shiftLead.firstName}{' '}
                          {perf.shiftLead.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 md:items-center md:justify-end">
                    {getWorkflowActions(perf)}

                    <button
                      onClick={() => handleViewPerformanceDetail(perf)}
                      className="flex items-center gap-1 rounded-md border border-gray-400 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:gap-2 sm:px-4"
                    >
                      <FaEye className="text-gray-400" />
                      <span className="hidden sm:inline">Détails</span>
                      <span className="sm:hidden">Détails</span>
                    </button>
                    {canManagePerformances && (
                      <button
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
      </div>
    </Layout>
  );
};

export default PerformancePage;
