import React, { useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFilePdf,
  FaInfoCircle,
  FaMusic,
  FaTimes,
  FaTrash,
  FaUser,
} from 'react-icons/fa';

import PerformanceDetail from '@/components/performance/PerformanceDetail';
import { usePerformances } from '@/lib/performance/logic';
import type { Performance } from '@/lib/performance/types';
import type { LeadershipShift } from '@/lib/shift/logic';
import {
  canDeleteShifts,
  canUpdateShifts,
  formatShiftDate,
  getShiftDuration,
  getStatusColor,
  ShiftStatus,
} from '@/lib/shift/logic';
import { exportShiftDetailToPDF } from '@/lib/shift/pdf-export';
import { useAuth } from '@/providers/AuthProvider';

interface ShiftDetailProps {
  shift: LeadershipShift;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ShiftDetail: React.FC<ShiftDetailProps> = ({
  shift,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const {
    performances,
    loading: performancesLoading,
    error: performancesError,
    fetchPerformances,
  } = usePerformances();
  const [selectedPerformance, setSelectedPerformance] =
    useState<Performance | null>(null);
  const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);

  // Fetch performances for this shift
  useEffect(() => {
    if (shift?.leaderId) {
      // Fetch with max limit (100) to get all performances for this shift
      fetchPerformances(
        { shiftLeadId: shift.leaderId },
        { page: 1, limit: 100 },
      );
    }
  }, [shift?.leaderId, fetchPerformances]);

  // Safety check - if no shift data, don't render
  if (!shift) {
    return null;
  }

  const canEdit = user && user.role ? canUpdateShifts(user.role) : false;
  const canDelete = user && user.role ? canDeleteShifts(user.role) : false;

  const handlePerformanceClick = (performance: Performance) => {
    setSelectedPerformance(performance);
    setShowPerformanceDetail(true);
  };

  const handleClosePerformanceDetail = () => {
    setShowPerformanceDetail(false);
    setSelectedPerformance(null);
  };

  const handleExportPDF = async () => {
    try {
      await exportShiftDetailToPDF(shift, performances || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting shift to PDF:', error);
      alert("Erreur lors de l'exportation du PDF");
    }
  };

  const getStatusIcon = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.ACTIVE:
        return <FaCheckCircle className="text-[12px] text-green-500" />;
      case ShiftStatus.UPCOMING:
        return <FaInfoCircle className="text-[12px] text-blue-500" />;
      case ShiftStatus.COMPLETED:
        return <FaCheckCircle className="text-[12px] text-gray-500" />;
      case ShiftStatus.CANCELLED:
        return <FaExclamationTriangle className="text-[12px] text-red-500" />;
      default:
        return <FaInfoCircle className="text-[12px] text-gray-500" />;
    }
  };

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

  // Get the actual status for display
  const actualStatus = getActualStatus(shift);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="h-[98vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl md:w-[70%]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <FaClock className="text-3xl text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {shift.name || 'Horaire sans nom'}
              </h2>
              <div className="mt-[1px] flex items-center gap-1">
                {getStatusIcon(actualStatus)}
                <span
                  className={`rounded-full px-2 py-[1px] text-[10px] font-medium ${getStatusColor(actualStatus)}`}
                >
                  {getStatusText(actualStatus)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-white transition-colors hover:bg-green-600"
            >
              <FaFilePdf className="text-sm" />
              Exporter PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Leader Information */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <FaUser className="text-xl text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Informations du conducteur
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium text-gray-900">
                      {shift.leader
                        ? `${shift.leader.firstName || ''} ${shift.leader.lastName || ''}`.trim() ||
                          'Inconnu'
                        : 'Inconnu'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">
                      {shift.leader?.email || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium text-gray-900">
                      {shift.leader?.phoneNumber || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <FaCalendarAlt className="text-xl text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Détails de l&apos;horaire
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de début:</span>
                    <span className="font-medium text-gray-900">
                      {shift.startDate ? formatShiftDate(shift.startDate) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de fin:</span>
                    <span className="font-medium text-gray-900">
                      {shift.endDate ? formatShiftDate(shift.endDate) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-medium text-gray-900">
                      {shift.startDate && shift.endDate
                        ? getShiftDuration(shift.startDate, shift.endDate)
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              {/* Events Information */}
              <div className="rounded-lg bg-green-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <FaMusic className="text-xl text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {' '}
                    Performances
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600"> Programmées:</span>
                    <span className="font-medium text-gray-900">
                      {performancesLoading ? '...' : performances?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">En préparation:</span>
                    <span className="font-medium text-gray-900">
                      {performancesLoading
                        ? '...'
                        : performances?.filter(
                            (p) => p.status === 'in_preparation',
                          ).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminées:</span>
                    <span className="font-medium text-gray-900">
                      {performancesLoading
                        ? '...'
                        : performances?.filter((p) => p.status === 'completed')
                            .length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="rounded-lg bg-yellow-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <FaMusic className="text-xl text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notes & Commentaires
                  </h3>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">
                  {shift.notes || 'Pas de note'}
                </p>
              </div>

              {/* Action Buttons */}
              {(canEdit || canDelete) && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Actions
                  </h3>
                  <div className="flex gap-3">
                    {canEdit && (
                      <button
                        onClick={onEdit}
                        className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                      >
                        <FaEdit className="text-sm" />
                        Modifier l&apos;horaire
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={onDelete}
                        className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                      >
                        <FaTrash className="text-sm" />
                        Supprimer l&apos;horaire
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performances List */}
          <div className="mt-4 rounded-lg bg-purple-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <FaMusic className="text-xl text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Performances ({performances?.length || 0})
              </h3>
            </div>

            {(() => {
              if (performancesLoading) {
                return (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-b-2 border-purple-500"></div>
                    <p className="text-sm text-purple-600">
                      Chargement des performances...
                    </p>
                  </div>
                );
              }
              if (performancesError) {
                return (
                  <div className="py-4 text-center">
                    <FaExclamationTriangle className="mx-auto mb-2 text-xl text-red-500" />
                    <p className="text-sm text-red-600">
                      Erreur lors du chargement des performances
                    </p>
                    <p className="text-xs text-red-500">{performancesError}</p>
                  </div>
                );
              }
              if (!performances || performances.length === 0) {
                return (
                  <div className="py-4 text-center">
                    <FaMusic className="mx-auto mb-2 text-xl text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Aucune performance associée à ce shift
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {performances.map((performance: Performance) => (
                    <div
                      key={performance.id}
                      className="cursor-pointer rounded-lg border border-purple-200 bg-white p-3 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50"
                      onClick={() => handlePerformanceClick(performance)}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-gray-900">
                            {performance.type}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {new Date(performance.date).toLocaleDateString(
                              'fr-FR',
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${(() => {
                              if (performance.status === 'upcoming')
                                return 'bg-blue-100 text-blue-800';
                              if (performance.status === 'in_preparation')
                                return 'bg-yellow-100 text-yellow-800';
                              if (performance.status === 'ready')
                                return 'bg-green-100 text-green-800';
                              if (performance.status === 'completed')
                                return 'bg-gray-100 text-gray-800';
                              return 'bg-gray-100 text-gray-800';
                            })()}`}
                          >
                            {(() => {
                              if (performance.status === 'upcoming')
                                return 'À venir';
                              if (performance.status === 'in_preparation')
                                return 'En préparation';
                              if (performance.status === 'ready') return 'Prêt';
                              if (performance.status === 'completed')
                                return 'Terminé';
                              return performance.status;
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                          {performance.location && (
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400" />
                              <span className="truncate">
                                {performance.location}
                              </span>
                            </div>
                          )}
                          {performance.expectedAudience && (
                            <div className="flex items-center gap-1">
                              <FaUser className="text-gray-400" />
                              <span>
                                {performance.expectedAudience} personnes
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaEye className="text-gray-400" />
                          <span>Voir détails</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Performance Detail Modal */}
      {showPerformanceDetail && selectedPerformance && (
        <PerformanceDetail
          performance={selectedPerformance}
          onClose={handleClosePerformanceDetail}
        />
      )}
    </div>
  );
};

export default ShiftDetail;
