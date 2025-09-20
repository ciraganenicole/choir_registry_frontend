import React, { useState } from 'react';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaMapMarkerAlt,
  FaMicrophone,
  FaMusic,
  FaPlay,
  FaStar,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';

import SongDetail from '@/components/library/SongDetail';
import { RehearsalDetail } from '@/components/rehearsal/RehearsalDetail';
import {
  getPerformanceStatusColor,
  getPerformanceStatusLabel,
  usePerformance,
  usePerformances,
} from '@/lib/performance/logic';
import type { Performance, PerformanceStatus } from '@/lib/performance/types';
import { useRehearsals } from '@/lib/rehearsal/logic';
import type { Rehearsal, RehearsalStatus } from '@/lib/rehearsal/types';

import PerformanceForm from './PerformanceForm';

interface PerformanceDetailProps {
  performance: Performance;
  onClose: () => void;
  onSuccess?: () => void;
}

const PerformanceDetail: React.FC<PerformanceDetailProps> = ({
  performance,
  onClose,
  onSuccess,
}) => {
  const [showAddSong, setShowAddSong] = useState(false);
  const [showSongDetail, setShowSongDetail] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(
    null,
  );
  const [showRehearsalDetail, setShowRehearsalDetail] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { updatePerformance, loading } = usePerformances();

  // Fetch full performance data including songs
  const { performance: fullPerformance, refreshPerformance } = usePerformance(
    performance.id,
  );

  // Use full performance data if available, fallback to prop
  const currentPerformance = fullPerformance || performance;

  // Fetch rehearsals for this performance
  const {
    rehearsals,
    isLoading: rehearsalsLoading,
    error: rehearsalsError,
    fetchRehearsals,
  } = useRehearsals({
    performanceId: performance.id,
    limit: 10,
  });

  // Rehearsals are automatically fetched by the useRehearsals hook

  const getStatusBadge = (status: PerformanceStatus) => {
    const colorClass = getPerformanceStatusColor(status);
    const label = getPerformanceStatusLabel(status);

    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  const handleViewSongDetail = (song: any) => {
    setSelectedSong(song);
    setShowSongDetail(true);
  };

  const handleCloseSongDetail = () => {
    setShowSongDetail(false);
    setSelectedSong(null);
  };

  const handleUpdatePerformance = async (data: any) => {
    await updatePerformance(performance.id, data);
    setShowAddSong(false);
    if (onSuccess) onSuccess();
  };

  const handleCancelEdit = () => {
    setShowAddSong(false);
  };

  const handleViewRehearsal = (rehearsal: Rehearsal) => {
    setSelectedRehearsal(rehearsal);
    setShowRehearsalDetail(true);
  };

  const handleCloseRehearsalDetail = () => {
    setShowRehearsalDetail(false);
    setSelectedRehearsal(null);
  };

  const handleRehearsalStatusChange = (
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

  const handleStatusChange = async (newStatus: PerformanceStatus) => {
    try {
      await updatePerformance(currentPerformance.id, { status: newStatus });

      setFeedback({
        type: 'success',
        message: `Statut changé avec succès vers &quot;${getPerformanceStatusLabel(newStatus)}&quot;`,
      });

      setShowStatusDialog(false);

      // Refresh performance data to get updated status
      if (refreshPerformance) {
        refreshPerformance();
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: `Erreur lors du changement de statut: ${error.message || 'Erreur inconnue'}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-[98%] overflow-y-auto rounded-lg bg-white p-4 shadow-xl md:w-[80%] md:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-row items-center justify-between gap-4 border-b border-gray-200 pb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <FaMusic className="text-xl text-orange-500 md:text-2xl" />
            <h2 className="truncate text-lg font-bold text-gray-900 md:text-2xl">
              Performance {currentPerformance.type}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-md bg-red-500 p-2 text-sm text-white hover:bg-red-600 md:gap-2 md:px-4 md:text-base"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div
            className={`mb-4 rounded-md border p-4 ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex">
              <div className="shrink-0">
                {feedback.type === 'success' ? (
                  <FaCheck className="size-5 text-green-400" />
                ) : (
                  <FaExclamationTriangle className="size-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm ${
                    feedback.type === 'success'
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}
                >
                  {feedback.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Information */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:mb-6 md:gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 md:text-sm">
              <FaCalendarAlt className="text-sm" />
              Date
            </div>
            <div className="text-sm font-semibold md:text-lg">
              {new Date(currentPerformance.date).toLocaleDateString()}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 md:text-sm">
              <FaMapMarkerAlt className="text-sm" />
              Emplacement
            </div>
            <div className="truncate text-sm font-semibold md:text-lg">
              {currentPerformance.location || 'Non spécifié'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 md:text-sm">
              <FaUsers className="text-sm" />
              Public attendu
            </div>
            <div className="truncate text-sm font-semibold md:text-lg">
              {currentPerformance.expectedAudience || 'Non spécifié'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 md:p-4">
            <div className="text-xs font-medium text-gray-500 md:text-sm">
              Statut
            </div>
            {getStatusBadge(currentPerformance.status)}
          </div>
        </div>

        {/* Status Management Section */}
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 md:mb-6 md:p-4">
          <div className="flex flex-row items-center justify-between gap-4">
            {/* Status Workflow */}
            <div className="flex flex-wrap items-center gap-1 text-xs md:gap-2 md:text-sm">
              <div
                className={`flex items-center gap-1 rounded-[5px] ${
                  currentPerformance.status === 'upcoming'
                    ? 'border border-blue-200 bg-blue-100 p-1 text-blue-800'
                    : 'text-blue-600'
                }`}
              >
                <FaStar className="text-xs" /> Créé
              </div>
              <FaArrowRight className="text-blue-400" />
              <div
                className={`flex items-center gap-1 rounded-[5px] ${
                  currentPerformance.status === 'in_preparation'
                    ? 'border border-yellow-200 bg-yellow-100 p-1 text-yellow-800'
                    : 'text-blue-600'
                }`}
              >
                <FaClock className="text-xs" /> En préparation
              </div>
              <FaArrowRight className="text-blue-400" />
              <div
                className={`flex items-center gap-1 rounded-[5px] ${
                  currentPerformance.status === 'ready'
                    ? 'border border-green-200 bg-green-100 p-1 text-green-800'
                    : 'text-blue-600'
                }`}
              >
                <FaPlay className="text-xs" /> Prêt
              </div>
              <FaArrowRight className="text-blue-400" />
              <div
                className={`flex items-center gap-1 rounded-[5px] ${
                  currentPerformance.status === 'completed'
                    ? 'border border-gray-200 bg-gray-100 p-1 text-gray-800'
                    : 'text-blue-600'
                }`}
              >
                <FaCheck className="text-xs" /> Terminé
              </div>
            </div>
            <button
              onClick={() => setShowStatusDialog(true)}
              className="flex items-center gap-1 rounded-md bg-blue-600 p-2 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:gap-2 md:px-4 md:text-sm"
            >
              <FaEdit className="text-sm" />{' '}
              <span className="hidden sm:inline">Changer le Statut</span>
            </button>
          </div>
        </div>

        {/* Promoted Data Section - Show what data was copied from rehearsals */}
        {(currentPerformance.status === 'in_preparation' ||
          currentPerformance.status === 'ready' ||
          currentPerformance.status === 'completed') && (
          <>
            {currentPerformance.performanceSongs &&
            currentPerformance.performanceSongs.length > 0 ? (
              <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 md:mb-6 md:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-900 md:text-base">
                      <FaMicrophone className="text-sm text-purple-600 md:text-base" />
                      <span className="truncate">
                        Données Promues des Répétitions
                      </span>
                    </h3>
                    <p className="text-xs text-purple-700 md:text-sm">
                      Données copiées des répétitions vers cette performance
                    </p>
                  </div>
                </div>

                {/* Detailed Promoted Data */}
                <div className="space-y-3">
                  {currentPerformance.performanceSongs.map(
                    (performanceSong) => (
                      <div
                        key={performanceSong.id}
                        className="rounded-lg border border-purple-200 bg-white p-3 md:p-4"
                      >
                        <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-purple-900 md:text-lg">
                              {performanceSong.song.title}
                            </h4>
                            <p className="truncate text-xs text-purple-600 md:text-sm">
                              par {performanceSong.song.composer}
                            </p>
                          </div>
                          <div className="shrink-0 text-xs text-purple-700 md:text-sm">
                            <span className="mr-8 font-bold">
                              Note: {performanceSong.musicalKey}
                            </span>{' '}
                            • Ordre: {performanceSong.order} • Temps:{' '}
                            {performanceSong.timeAllocated} min
                          </div>
                        </div>

                        {/* Promoted Data Details */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                          {/* Lead Singer */}
                          {performanceSong.leadSinger && (
                            <div className="rounded-lg bg-orange-50 p-2 md:p-3">
                              <div className="text-xs font-medium text-orange-800 md:text-sm">
                                Lead Singer(s)
                              </div>
                              <div className="truncate text-sm font-semibold text-orange-900 md:text-base">
                                {performanceSong.leadSinger.firstName}{' '}
                                {performanceSong.leadSinger.lastName}
                              </div>
                            </div>
                          )}

                          {/* Voice Parts */}
                          {performanceSong.voiceParts &&
                            performanceSong.voiceParts.length > 0 && (
                              <div className="rounded-lg bg-blue-50 p-2 md:p-3">
                                <div className="flex flex-row items-center justify-between text-xs font-medium text-blue-800 md:text-sm">
                                  <span className="font-bold">
                                    Attaque chant
                                  </span>
                                  <span>
                                    {performanceSong.voiceParts.length}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-blue-700">
                                  {performanceSong.voiceParts
                                    .slice(0, 2)
                                    .map(
                                      (voicePart: any) =>
                                        `${voicePart.type || 'Partie vocale'} (${
                                          voicePart.members
                                            ?.map(
                                              (member: any) =>
                                                `${member.lastName} ${member.firstName}`,
                                            )
                                            .join(', ') || 'Aucun membre'
                                        })`,
                                    )
                                    .join(', ')}
                                  {performanceSong.voiceParts.length > 2 &&
                                    ` +${performanceSong.voiceParts.length - 2} plus`}
                                </div>
                              </div>
                            )}

                          {/* Musicians */}
                          {performanceSong.musicians &&
                            performanceSong.musicians.length > 0 && (
                              <div className="rounded-lg bg-green-50 p-2 md:p-3">
                                <div className="flex flex-row items-center justify-between text-xs font-medium text-green-800 md:text-sm">
                                  <span className="font-bold">Defense</span>
                                  <span>
                                    {performanceSong.musicians.length}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-green-700">
                                  {performanceSong.musicians
                                    .slice(0, 2)
                                    .map(
                                      (musician: any) =>
                                        `${musician.user?.lastName} ${musician.user?.firstName} (${musician.instrument})`,
                                    )
                                    .join(', ')}
                                  {performanceSong.musicians.length > 2 &&
                                    ` +${performanceSong.musicians.length - 2} plus`}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Focus Points and Notes */}
                        {(performanceSong.focusPoints ||
                          performanceSong.notes) && (
                          <div className="mt-3 rounded-lg bg-gray-50 p-2 md:p-3">
                            <div className="text-xs font-medium text-gray-800 md:text-sm">
                              Points de Focus & Notes Promues
                            </div>
                            {performanceSong.focusPoints && (
                              <div className="mt-1 text-xs text-gray-700 md:text-sm">
                                <strong>Focus:</strong>{' '}
                                {performanceSong.focusPoints}
                              </div>
                            )}
                            {performanceSong.notes && (
                              <div className="mt-1 text-xs text-gray-700 md:text-sm">
                                <strong>Notes:</strong> {performanceSong.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 md:mb-6 md:p-4">
                <div className="text-center text-purple-600">
                  <FaMicrophone className="mx-auto mb-2 text-2xl text-purple-400 md:text-3xl" />
                  <p className="text-sm font-medium md:text-base">
                    Aucune donnée promue trouvée
                  </p>
                  <p className="text-xs md:text-sm">
                    Les données des répétitions n&apos;ont pas encore été
                    promues vers cette performance
                  </p>
                  <p className="mt-2 text-xs">
                    Performance Songs:{' '}
                    {currentPerformance.performanceSongs?.length || 0}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rehearsal Management Section */}
        {(performance.status === 'upcoming' ||
          performance.status === 'in_preparation') && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 md:mb-6 md:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-green-900 md:text-base">
                  <FaMicrophone className="text-sm text-green-600 md:text-base" />
                  <span className="truncate">
                    Répétitions ({rehearsals?.length || 0})
                  </span>
                </h3>
                <p className="text-xs text-green-700 md:text-sm">
                  Répétitions associées à cette performance
                </p>
              </div>
            </div>

            {/* Rehearsals List */}
            {(() => {
              if (rehearsalsLoading) {
                return (
                  <div className="rounded-lg border-2 border-dashed border-green-300 p-4 text-center text-green-600 md:p-6">
                    <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-b-2 border-green-500 md:size-8"></div>
                    <p className="text-sm font-medium md:text-base">
                      Chargement des répétitions...
                    </p>
                  </div>
                );
              }

              if (rehearsalsError) {
                return (
                  <div className="rounded-lg border-2 border-dashed border-red-300 p-4 text-center text-red-600 md:p-6">
                    <FaExclamationTriangle className="mx-auto mb-2 text-2xl text-red-400 md:text-3xl" />
                    <p className="text-sm font-medium md:text-base">
                      Erreur lors du chargement des répétitions
                    </p>
                    <p className="text-xs md:text-sm">{rehearsalsError}</p>
                  </div>
                );
              }

              if (!rehearsals || rehearsals.length === 0) {
                return (
                  <div className="rounded-lg border-2 border-dashed border-green-300 p-4 text-center text-green-600 md:p-6">
                    <FaMicrophone className="mx-auto mb-2 text-2xl text-green-400 md:text-3xl" />
                    <p className="text-sm font-medium md:text-base">
                      Aucune répétition ajoutée à cette performance
                    </p>
                    <p className="text-xs md:text-sm">
                      Cliquez sur &quot;Créer une Répétition&quot; pour
                      commencer la planification
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {rehearsals.map((rehearsal) => (
                    <div
                      key={rehearsal.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-green-200 bg-white p-3 md:flex-row md:items-center md:p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-gray-900 md:text-base">
                            {rehearsal.title}
                          </h4>
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {rehearsal.type}
                          </span>
                          <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            {rehearsal.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 md:gap-4 md:text-sm">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-sm text-gray-400" />
                            {new Date(rehearsal.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClock className="text-sm text-gray-400" />
                            {rehearsal.duration} min
                          </div>
                          {rehearsal.location && (
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-sm text-gray-400" />
                              <span className="truncate">
                                {rehearsal.location}
                              </span>
                            </div>
                          )}
                          {rehearsal.rehearsalSongs &&
                            rehearsal.rehearsalSongs.length > 0 && (
                              <div className="flex items-center gap-1">
                                <FaMusic className="text-sm text-gray-400" />
                                {rehearsal.rehearsalSongs.length} chanson(s)
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleViewRehearsal(rehearsal)}
                          className="flex items-center gap-1 rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 md:px-3 md:text-sm"
                        >
                          <FaEye className="text-sm" /> Voir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quick Actions for Other Statuses */}
        {performance.status === 'ready' && (
          <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 md:mb-6 md:p-4">
            <div className="mb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-900 md:text-base">
                <FaMicrophone className="text-sm text-purple-600 md:text-base" />
                Répétitions Terminées
              </h3>
              <p className="text-xs text-purple-700 md:text-sm">
                Toutes les répétitions sont terminées. La performance est prête
                à être exécutée.
              </p>
            </div>
          </div>
        )}

        {/* Songs Performed - Only show when performance is ready or completed */}
        {(performance.status === 'ready' ||
          performance.status === 'completed') &&
          performance.performanceSongs &&
          performance.performanceSongs.length > 0 && (
            <div className="mb-4 md:mb-6">
              <div className="mb-3 flex items-center gap-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 md:text-lg">
                  <FaMusic className="text-sm text-blue-500 md:text-base" />
                  <span className="truncate">
                    Chansons Interprétées ({performance.performanceSongs.length}
                    )
                  </span>
                </h3>
              </div>

              <div className="space-y-3 md:space-y-4">
                {performance.performanceSongs.map((performanceSong) => (
                  <div
                    key={performanceSong.id}
                    className="rounded-lg border border-gray-200 p-3 md:p-4"
                  >
                    <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-gray-900 md:text-lg">
                          {performanceSong.song.title}
                        </h4>
                        <p className="truncate text-xs text-gray-600 md:text-sm">
                          par {performanceSong.song.composer}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleViewSongDetail(performanceSong.song)
                        }
                        className="flex shrink-0 items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 md:px-3 md:text-sm"
                      >
                        <FaEye className="text-sm" />{' '}
                        <span className="hidden sm:inline">Voir Détails</span>
                        <span className="sm:hidden">Voir</span>
                      </button>
                    </div>

                    {/* Song Details Summary */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                      {/* Lead */}
                      {performanceSong.leadSinger && (
                        <div className="rounded-lg bg-orange-50 p-2 md:p-3">
                          <div className="text-xs font-medium text-orange-800 md:text-sm">
                            Conducteur
                          </div>
                          <div className="truncate text-sm font-semibold text-orange-900 md:text-base">
                            {performanceSong.leadSinger.firstName}{' '}
                            {performanceSong.leadSinger.lastName}
                          </div>
                        </div>
                      )}

                      {/* Voice Parts */}
                      {performanceSong.voiceParts &&
                        performanceSong.voiceParts.length > 0 && (
                          <div className="rounded-lg bg-blue-50 p-2 md:p-3">
                            <div className="text-xs font-medium text-blue-800 md:text-sm">
                              Parties vocales
                            </div>
                            <div className="text-xs text-blue-900 md:text-sm">
                              {performanceSong.voiceParts.length} parties
                            </div>
                            <div className="mt-1 text-xs text-blue-700">
                              {(() => {
                                const voicePartsText =
                                  performanceSong.voiceParts
                                    .slice(0, 2)
                                    .map(
                                      (voicePart: any) =>
                                        `${voicePart.voicePart} (${voicePart.members?.length || 0} membres)`,
                                    )
                                    .join(', ');
                                const additionalCount =
                                  performanceSong.voiceParts.length > 2
                                    ? ` +${performanceSong.voiceParts.length - 2} plus`
                                    : '';
                                return voicePartsText + additionalCount;
                              })()}
                            </div>
                          </div>
                        )}

                      {/* Musicians */}
                      {performanceSong.musicians &&
                        performanceSong.musicians.length > 0 && (
                          <div className="rounded-lg bg-purple-50 p-2 md:p-3">
                            <div className="text-xs font-medium text-purple-800 md:text-sm">
                              Musiciens
                            </div>
                            <div className="text-xs text-purple-900 md:text-sm">
                              {performanceSong.musicians.length} musiciens
                            </div>
                            <div className="mt-1 text-xs text-purple-700">
                              {(() => {
                                const musiciansText = performanceSong.musicians
                                  .slice(0, 2)
                                  .map(
                                    (musician: any) =>
                                      `${musician.user?.firstName || 'Inconnu'} ${musician.user?.lastName || 'Utilisateur'} (${musician.instrument})`,
                                  )
                                  .join(', ');
                                const additionalCount =
                                  performanceSong.musicians.length > 2
                                    ? ` +${performanceSong.musicians.length - 2} plus`
                                    : '';
                                return musiciansText + additionalCount;
                              })()}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Notes */}
                    {performanceSong.notes && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-2 md:p-3">
                        <div className="text-xs font-medium text-gray-800 md:text-sm">
                          Notes
                        </div>
                        <div className="mt-1 text-xs text-gray-700 md:text-sm">
                          {performanceSong.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* No Songs Message */}
        {performance.status === 'ready' &&
          (!performance.performanceSongs ||
            performance.performanceSongs.length === 0) && (
            <div className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-gray-500 md:mb-6 md:p-8">
              <FaMusic className="mx-auto mb-2 text-3xl text-gray-300 md:text-4xl" />
              <p className="text-sm md:text-base">
                Aucune chanson disponible pour cette performance
              </p>
              <p className="text-xs md:text-sm">
                Les chansons seront ajoutées lors de la promotion des
                répétitions
              </p>
            </div>
          )}

        {/* Add Song Modal */}
        {showAddSong && (
          <PerformanceForm
            performance={performance}
            onCancel={handleCancelEdit}
            onSubmit={handleUpdatePerformance}
            loading={loading}
          />
        )}

        {/* Song Detail Modal */}
        {showSongDetail && selectedSong && (
          <SongDetail song={selectedSong} onClose={handleCloseSongDetail} />
        )}

        {/* Rehearsal Detail Modal */}
        {showRehearsalDetail && selectedRehearsal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-[90vh] w-[98%] overflow-y-auto rounded-lg bg-white shadow-xl md:w-[80%]">
              <RehearsalDetail
                rehearsal={selectedRehearsal}
                onClose={handleCloseRehearsalDetail}
                onStatusChange={(newStatus) =>
                  handleRehearsalStatusChange(selectedRehearsal.id, newStatus)
                }
              />
            </div>
          </div>
        )}

        {/* Status Change Dialog */}
        {showStatusDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[95%] rounded-lg bg-white p-4 shadow-xl md:w-[500px] md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                  Changer le Statut de la Performance
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStatusDialog(false)}
                  className="rounded text-lg text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 md:text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 md:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FaClock className="text-sm text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900 md:text-base">
                      Statut Actuel
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(currentPerformance.status)}
                    <span className="text-xs text-blue-700 md:text-sm">
                      {getPerformanceStatusLabel(currentPerformance.status)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 md:p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-900 md:text-base">
                    Nouveau Statut
                  </h4>
                  <div className="space-y-2">
                    {(
                      [
                        'upcoming',
                        'in_preparation',
                        'ready',
                        'completed',
                      ] as PerformanceStatus[]
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={
                          status === currentPerformance.status || loading
                        }
                        className={`flex w-full items-center justify-between rounded-lg border p-2 transition-colors md:p-3 ${
                          status === currentPerformance.status
                            ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          {status === 'upcoming' && (
                            <FaStar className="text-sm text-blue-500" />
                          )}
                          {status === 'in_preparation' && (
                            <FaClock className="text-sm text-yellow-500" />
                          )}
                          {status === 'ready' && (
                            <FaPlay className="text-sm text-green-500" />
                          )}
                          {status === 'completed' && (
                            <FaCheck className="text-sm text-gray-500" />
                          )}
                          <span className="text-sm font-medium md:text-base">
                            {getPerformanceStatusLabel(status)}
                          </span>
                        </div>
                        {status === currentPerformance.status && (
                          <span className="text-xs text-gray-500">Actuel</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {loading && (
                  <div className="text-center text-blue-600">
                    <div className="mx-auto mb-2 size-5 animate-spin rounded-full border-b-2 border-blue-500 md:size-6"></div>
                    <p className="text-xs md:text-sm">
                      Changement de statut en cours...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 md:pt-6">
                <button
                  type="button"
                  onClick={() => setShowStatusDialog(false)}
                  className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 md:px-4 md:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDetail;
