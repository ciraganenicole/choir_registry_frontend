import React, { useState } from 'react';
import {
  FaCalendarAlt,
  FaChevronRight,
  FaClock,
  FaMusic,
  FaPlus,
  FaRegCalendarAlt,
  FaTimes,
  FaUser,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import ShiftDetail from '@/components/shift/ShiftDetail';
import { ShiftForm } from '@/lib/shift/form';
import type { LeadershipShift } from '@/lib/shift/logic';
import {
  canCreateShifts,
  canUpdateShifts,
  formatShiftDate,
  getShiftDuration,
  getStatusColor,
  ShiftStatus,
  useCurrentShift,
  useFilteredShifts,
  useLeaderHistory,
  useLeadUsersCount,
  useShiftStats,
  useUpcomingShifts,
} from '@/lib/shift/logic';
import { useAuth } from '@/providers/AuthProvider';

const statusBadge = (shift: LeadershipShift) => {
  // Function to determine actual status based on dates
  const getActualStatus = (shiftData: LeadershipShift): ShiftStatus => {
    if (shiftData.status === ShiftStatus.CANCELLED) {
      return ShiftStatus.CANCELLED;
    }

    const now = new Date();
    const startDate = new Date(shiftData.startDate);
    const endDate = new Date(shiftData.endDate);

    if (now < startDate) {
      return ShiftStatus.UPCOMING;
    }
    if (now >= startDate && now <= endDate) {
      return ShiftStatus.ACTIVE;
    }
    return ShiftStatus.COMPLETED;
  };

  const actualStatus = getActualStatus(shift);
  const colorClasses = getStatusColor(actualStatus);

  const getStatusText = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.ACTIVE:
        return 'Actif';
      case ShiftStatus.UPCOMING:
        return 'À venir';
      case ShiftStatus.COMPLETED:
        return 'Terminé';
      case ShiftStatus.CANCELLED:
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <span
      className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${colorClasses}`}
    >
      {getStatusText(actualStatus)}
    </span>
  );
};

const ShiftPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
  });
  const [showMyShifts, setShowMyShifts] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedShift, setSelectedShift] = useState<LeadershipShift | null>(
    null,
  );

  // Fetch data using hooks with stable filtering
  const {
    shifts,
    isLoading: shiftsLoading,
    error: shiftsError,
    totalCount,
    refetch: refetchShifts,
  } = useFilteredShifts(filters, showMyShifts, user?.id);
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useShiftStats();
  const {
    leaderHistory,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useLeaderHistory();
  const {
    currentShift,
    isLoading: currentShiftLoading,
    refetch: refetchCurrentShift,
  } = useCurrentShift();
  const {
    upcomingShifts,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingShifts(3);
  const { count: leadUsersCount, isLoading: leadUsersLoading } =
    useLeadUsersCount();

  // Check permissions
  const canCreate = user && user.role ? canCreateShifts(user.role) : false;
  const canEdit = user && user.role ? canUpdateShifts(user.role) : false;

  // Handle form actions
  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Refresh the shifts data without page reload
    refetchShifts();
    refetchStats();
    refetchHistory();
    refetchCurrentShift();
    refetchUpcoming();
  };

  // Handle details popup
  const handleShowDetails = (shift: LeadershipShift) => {
    setSelectedShift(shift);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedShift(null);
  };

  const handleEditShift = () => {
    // Close the details modal first
    setShowDetails(false);
    // Then open edit form with the selected shift
    setShowCreateForm(true);
  };

  const handleEditSuccess = () => {
    setShowCreateForm(false);
    setSelectedShift(null);
    // Refresh the shifts data without page reload
    refetchShifts();
    refetchStats();
    refetchHistory();
    refetchCurrentShift();
    refetchUpcoming();
  };

  const handleDeleteShift = () => {
    handleCloseDetails();
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    // Scroll to top of shift list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterToggle = (isMyShifts: boolean) => {
    setShowMyShifts(isMyShifts);
    // Reset to first page when changing filter
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  // Prepare stats data
  const statsData = [
    {
      label: 'Horaire Actuel',
      value: currentShift
        ? `${currentShift.leader.firstName} ${currentShift.leader.lastName}`
        : 'Aucun',
      icon: <FaUser className="ml-2 text-[14px] text-orange-400 md:text-xl" />,
    },
    {
      label: 'Total des Horaires',
      value: stats?.totalShifts || 0,
      icon: (
        <FaCalendarAlt className="ml-2 text-[14px] text-orange-400 md:text-xl" />
      ),
    },
    {
      label: 'Conducteurs Actifs',
      value: leadUsersLoading ? '...' : leadUsersCount,
      icon: <FaUsers className="ml-2 text-[14px] text-orange-400 md:text-xl" />,
    },
    {
      label: 'Prochaine Transition',
      value: stats?.nextTransitionDays
        ? `${stats.nextTransitionDays} jours`
        : 'N/A',
      icon: <FaClock className="ml-2 text-[14px] text-orange-400 md:text-xl" />,
    },
  ];

  // Handle loading states
  const isLoading =
    shiftsLoading ||
    statsLoading ||
    historyLoading ||
    currentShiftLoading ||
    upcomingLoading ||
    leadUsersLoading;

  // Handle errors
  const hasError = shiftsError || statsError || historyError;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (hasError) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl text-red-500">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Erreur de chargement
            </h3>
            <p className="text-gray-600">
              {shiftsError ||
                statsError ||
                historyError ||
                "Une erreur s'est produite lors du chargement des données d'horaire."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-1 py-8 md:px-4">
        <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-1 text-[16px] font-bold text-gray-900 md:text-3xl">
              Horaire
            </h1>
            <p className="text-[12px] text-gray-500 md:text-base">
              Gérez les périodes de direction et les affectations des
              conducteurs
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => handleFilterToggle(false)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  !showMyShifts
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tous les horaires
              </button>
              <button
                onClick={() => handleFilterToggle(true)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  showMyShifts
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mes horaires
              </button>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 md:self-auto"
              >
                <FaPlus /> Créer
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:mb-8 md:grid-cols-4 md:gap-4">
          {statsData.map((stat) => (
            <Card key={stat.label} className="border-l-4 border-orange-400">
              <CardContent>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center text-[12px] font-medium text-gray-500 md:text-sm">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-[14px] font-bold text-gray-900 md:text-2xl">
                      {stat.value}
                    </div>
                  </div>
                  <div>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm md:w-[70%] md:p-6">
            {/* Filter Status Indicator */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {showMyShifts ? 'Mes horaires' : 'Tous les horaires'}
                </h2>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                  {shifts.length} {shifts.length === 1 ? 'horaire' : 'horaires'}
                </span>
              </div>
            </div>

            {shifts.length === 0 ? (
              <div className="py-8 text-center">
                <FaCalendarAlt className="mx-auto mb-4 text-4xl text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {showMyShifts
                    ? 'Aucun de vos horaires'
                    : 'Aucun horaire disponible'}
                </h3>
                <p className="mb-4 text-gray-600">
                  {showMyShifts
                    ? "Vous n'avez pas encore d'horaires assignés"
                    : 'Cliquez sur le bouton pour créer un nouvel horaire'}
                </p>
                {canCreate && !showMyShifts && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    Créer
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 md:gap-6">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="rounded-xl border border-gray-400 bg-white p-3 md:p-5"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-row items-center">
                          <span className="mr-2 text-lg font-bold text-gray-900 md:text-xl">
                            {shift.name}
                          </span>
                          {statusBadge(shift)}
                        </div>
                        <div className="mb-2 flex flex-col justify-between md:flex-row md:items-center">
                          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-600 md:text-sm">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-gray-400" />
                              Dirigé par {shift.leader.firstName}{' '}
                              {shift.leader.lastName}
                            </div>
                            <div className="flex items-center gap-2">
                              <FaRegCalendarAlt className="text-gray-400" />
                              {formatShiftDate(shift.startDate)} -{' '}
                              {formatShiftDate(shift.endDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <FaUsers className="text-gray-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <FaClock className="text-gray-400" />
                              {getShiftDuration(shift.startDate, shift.endDate)}
                            </div>
                          </div>
                          <div className="my-2 flex flex-row gap-2 md:my-0 md:items-end">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setSelectedShift(shift);
                                  handleEditShift();
                                }}
                                className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Modifier
                              </button>
                            )}
                            <button
                              onClick={() => handleShowDetails(shift)}
                              className="rounded-md border border-gray-300 bg-blue-500 px-4 py-1 text-[12px] font-medium text-white transition-colors hover:bg-blue-600 md:text-base"
                            >
                              Détails
                            </button>
                          </div>
                        </div>

                        {shift.status === ShiftStatus.ACTIVE &&
                          upcomingShifts.length > 0 &&
                          upcomingShifts[0] && (
                            <div className="my-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                              <div className="mb-1 text-sm font-semibold text-orange-700">
                                Prochaine transition:
                              </div>
                              <div className="font-medium text-gray-800">
                                {upcomingShifts[0].name} -{' '}
                                {upcomingShifts[0].leader.firstName}{' '}
                                {upcomingShifts[0].leader.lastName}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                                <FaRegCalendarAlt className="text-orange-400" />
                                {formatShiftDate(upcomingShifts[0].startDate)}
                                <FaChevronRight className="text-gray-400" />
                                <span>
                                  <FaUsers className="mr-1 inline text-gray-400" />
                                  {getShiftDuration(
                                    upcomingShifts[0].startDate,
                                    upcomingShifts[0].endDate,
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                        {shift.notes && (
                          <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3">
                            <div className="mb-2 flex items-center">
                              <FaMusic className="mr-2 text-blue-400" />
                              <span className="font-semibold text-blue-900">
                                Notes
                              </span>
                            </div>
                            <div className="text-sm text-blue-800">
                              {shift.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Pagination
                currentPage={filters.page}
                totalPages={Math.ceil(totalCount / filters.limit)}
                onPageChange={handlePageChange}
              />
            </div>
          </div>

          <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:w-[30%] md:p-6">
            <div className="mb-2 flex items-center">
              <FaUser className="mr-2 text-xl text-gray-700" />
              <h2 className="mr-2 text-xl font-bold text-gray-900">
                Historique des conducteurs
              </h2>
            </div>
            <p className="mb-4 text-gray-500">
              Historique des performances des conducteurs
            </p>

            {leaderHistory.length === 0 ? (
              <div className="py-8 text-center">
                <FaUser className="mx-auto mb-4 text-4xl text-gray-300" />
                <p className="text-gray-600">Aucun historique disponible</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-4 font-semibold text-gray-700">
                        Conducteur
                      </th>
                      <th className="py-2 font-semibold text-gray-700">
                        Nombre de perf.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderHistory.map((leader) => (
                      <tr
                        key={leader.leaderId}
                        className="border-b last:border-0"
                      >
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {leader.leaderName}
                        </td>
                        <td className="py-2">{leader.totalEvents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Shift Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedShift
                    ? "Modifier l'horaire"
                    : 'Créer un nouvel horaire'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedShift(null);
                  }}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="p-6">
                <ShiftForm
                  shift={selectedShift}
                  onSuccess={
                    selectedShift ? handleEditSuccess : handleCreateSuccess
                  }
                  onCancel={() => {
                    setShowCreateForm(false);
                    setSelectedShift(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Shift Details Modal */}
        {showDetails && selectedShift && (
          <ShiftDetail
            shift={selectedShift}
            onClose={handleCloseDetails}
            onEdit={handleEditShift}
            onDelete={handleDeleteShift}
          />
        )}
      </div>
    </Layout>
  );
};

export default ShiftPage;
