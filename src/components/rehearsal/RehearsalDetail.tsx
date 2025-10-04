import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaMicrophone,
  FaMusic,
  FaStar,
  FaTimes,
  FaUser,
  FaUsers,
} from 'react-icons/fa';

import {
  getDifficultyColor,
  getMusicalKeyColor,
  getRehearsalTypeColor,
  useRehearsalSongs,
} from '@/lib/rehearsal/logic';
import type { Rehearsal, RehearsalStatus } from '@/lib/rehearsal/types';

import { usePromoteRehearsal } from '../../lib/performance/logic';
import { useUsers } from '../../lib/user/useUsers';
import { RehearsalStatusUpdater } from './RehearsalStatusUpdater';

interface RehearsalDetailProps {
  rehearsal: Rehearsal;
  onDelete?: () => void;
  onClose?: () => void;
  onStatusChange?: (newStatus: RehearsalStatus) => void;
}

export const RehearsalDetail: React.FC<RehearsalDetailProps> = React.memo(
  ({ rehearsal, onClose, onStatusChange }) => {
    const { getUserName, users } = useUsers();
    const { rehearsalSongs: rehearsalSongsData, isLoading: songsLoading } =
      useRehearsalSongs(rehearsal.id);
    const { promoteRehearsal, isLoading: isPromoting } = usePromoteRehearsal();

    // Local state to track if rehearsal has been promoted
    const [isPromoted, setIsPromoted] = useState(() => {
      return (
        rehearsal.isPromoted ||
        (rehearsal.performance?.status &&
          ['ready', 'completed'].includes(rehearsal.performance.status))
      );
    });

    // Update local state when rehearsal prop changes
    React.useEffect(() => {
      const hasBeenPromoted =
        rehearsal.isPromoted ||
        (rehearsal.performance?.status &&
          ['ready', 'completed'].includes(rehearsal.performance.status));

      setIsPromoted(hasBeenPromoted);
    }, [rehearsal.isPromoted, rehearsal.id, rehearsal.performance?.status]);

    // Add loading state for better UX
    const isLoading = songsLoading || isPromoting;

    // Memoized helper function to normalize song data from different sources
    const normalizeSong = useCallback(
      (song: any) => {
        // If it's from the dedicated endpoint (RehearsalSongWithSeparation)
        if (song.songLibrary && song.rehearsalDetails) {
          return {
            id: song.songLibrary.id,
            songId: song.songLibrary.id,
            song: {
              id: song.songLibrary.id,
              title: song.songLibrary.title,
              composer: song.songLibrary.composer,
              genre: song.songLibrary.genre,
            },
            leadSingerIds: (() => {
              const leadSingers = song.rehearsalDetails.leadSingers?.map(
                (ls: any) => ls.id,
              );
              if (leadSingers) return leadSingers;
              const leadSinger = song.rehearsalDetails.leadSinger?.map(
                (ls: any) => ls.id,
              );
              return leadSinger || [];
            })(),
            leadSinger:
              song.rehearsalDetails.leadSingers?.[0] ||
              song.rehearsalDetails.leadSinger?.[0] ||
              null,
            difficulty: song.rehearsalDetails.difficulty,
            needsWork: song.rehearsalDetails.needsWork,
            order: song.rehearsalDetails.order,
            timeAllocated: song.rehearsalDetails.timeAllocated,
            focusPoints: song.rehearsalDetails.focusPoints,
            notes: song.rehearsalDetails.notes,
            musicalKey: song.rehearsalDetails.musicalKey,
            voiceParts:
              song.rehearsalDetails.voiceParts?.map((vp: any) => {
                const normalizedVp = {
                  ...vp,
                  members:
                    vp.members ||
                    vp.memberIds
                      ?.map((id: number) => {
                        const user = users.find((u) => u.id === id);
                        return user
                          ? {
                              id: user.id,
                              firstName: user.firstName,
                              lastName: user.lastName,
                            }
                          : null;
                      })
                      .filter(Boolean) ||
                    [],
                };

                return normalizedVp;
              }) || [],
            musicians: song.rehearsalDetails.musicians || [],
          };
        }

        // If it's from the regular rehearsal endpoint (RehearsalSong)
        const normalizedSong = { ...song };

        if (Array.isArray(song.leadSinger)) {
          if (song.leadSinger.length > 0) {
            normalizedSong.leadSinger = song.leadSinger[0];
            normalizedSong.leadSingerId = song.leadSinger[0].id;
          } else {
            normalizedSong.leadSinger = null;
            normalizedSong.leadSingerId = 0;
          }
        }

        if (normalizedSong.voiceParts) {
          normalizedSong.voiceParts = normalizedSong.voiceParts.map(
            (vp: any) => ({
              ...vp,
              members:
                vp.members ||
                vp.memberIds
                  ?.map((id: number) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    const { id: userId, firstName, lastName } = user;
                    return { id: userId, firstName, lastName };
                  })
                  .filter(Boolean) ||
                [],
            }),
          );
        }

        return normalizedSong;
      },
      [users],
    );

    // Memoize songs processing to avoid recalculation on every render
    const songs = useMemo(() => {
      const rawSongs =
        rehearsalSongsData?.rehearsalSongs || rehearsal.rehearsalSongs || [];
      return rawSongs.map(normalizeSong);
    }, [
      rehearsalSongsData?.rehearsalSongs,
      rehearsal.rehearsalSongs,
      normalizeSong,
    ]);

    // Memoize canPromote check to avoid recalculation
    const canPromote = useMemo(() => {
      if (!rehearsal.id || rehearsal.id <= 0) return false;
      if (!rehearsal.performanceId || rehearsal.performanceId <= 0)
        return false;
      if (!songs || songs.length === 0) return false;
      if (rehearsal.status !== 'Completed') return false; // ✅ Only completed rehearsals can be promoted
      if (isPromoted) return false; // ✅ Already promoted rehearsals cannot be promoted again

      return true;
    }, [
      rehearsal.id,
      rehearsal.performanceId,
      songs,
      rehearsal.status,
      isPromoted,
    ]);

    const handlePromoteToPerformance = useCallback(async () => {
      if (!canPromote) {
        if (rehearsal.isPromoted) {
          toast.error(
            'Cette répétition a déjà été promue vers la performance.',
          );
        } else if (rehearsal.status !== 'Completed') {
          toast.error(
            `Impossible de promouvoir cette répétition. La répétition doit être terminée (statut actuel: ${rehearsal.status}).`,
          );
        } else {
          toast.error(
            'Impossible de promouvoir cette répétition. Vérifiez que la répétition est liée à une performance et contient des chansons.',
          );
        }
        return;
      }

      const promotedPerformance = await promoteRehearsal(rehearsal.id);

      if (promotedPerformance) {
        toast.success('Répétition promue avec succès vers la performance!');
        // Update the local state to mark it as promoted
        // This will automatically disable the promote button
        setIsPromoted(true);
      }
    }, [
      canPromote,
      promoteRehearsal,
      rehearsal.performanceId,
      rehearsal.id,
      rehearsal.status,
      isPromoted,
    ]);

    const formatDate = useCallback((date: string | Date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }, []);

    const formatDuration = useCallback((minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
      }
      return `${mins}min`;
    }, []);

    // Show loading state if data is being fetched
    if (isLoading && !rehearsalSongsData) {
      return (
        <div className="relative">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex items-center justify-center py-8">
              <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-3 font-medium text-blue-600">
                Chargement des détails...
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="mt-3 flex items-center gap-2 md:gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <FaMusic className="text-[12px] text-blue-600 md:text-xl" />
                  </div>
                  <h2 className="text-[16px] font-bold text-gray-900 md:text-2xl">
                    {rehearsal.title}
                  </h2>
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-red-600 p-2 text-sm font-medium text-white transition-colors hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-gray-500 md:px-4"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium md:px-3 md:text-sm ${getRehearsalTypeColor(rehearsal.type)}`}
                >
                  <FaStar className="text-xs" />
                  {rehearsal.type}
                </span>
                <RehearsalStatusUpdater
                  rehearsalId={rehearsal.id}
                  currentStatus={rehearsal.status}
                  onStatusChange={onStatusChange}
                  size="md"
                />
                {rehearsal.isTemplate && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-[12px] font-medium text-purple-800 md:px-3 md:text-sm">
                    <FaStar className="text-xs" />
                    Modèle
                  </span>
                )}

                {/* Promotion Status */}
                {rehearsal.isPromoted ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">
                    <FaMicrophone />✅ Déjà promue
                  </div>
                ) : canPromote ? (
                  <button
                    onClick={handlePromoteToPerformance}
                    disabled={isPromoting}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-2 py-1 text-[12px] font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50 md:px-3 md:text-sm"
                    title="Promouvoir vers Performance (duplicates will be skipped)"
                  >
                    <FaMicrophone />
                    {isPromoting ? 'Promotion...' : 'Promouvoir'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-300 px-2 py-1 text-[12px] font-medium text-gray-400 transition-colors md:px-3 md:text-sm"
                    title={(() => {
                      if (rehearsal.status !== 'Completed') {
                        return `Répétition doit être terminée (statut actuel: ${rehearsal.status})`;
                      }
                      return 'Vérifiez que la répétition est liée à une performance et contient des chansons';
                    })()}
                  >
                    <FaMicrophone />
                    Promouvoir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FaCalendarAlt className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Informations générales
                </h3>
              </div>

              {/* Status Indicator */}
              <div
                className="mb-4 rounded-lg border-l-4 p-3"
                style={(() => {
                  if (rehearsal.isPromoted) {
                    return {
                      backgroundColor: '#f0f9ff',
                      borderLeftColor: '#3b82f6',
                    };
                  }
                  if (rehearsal.status === 'Completed') {
                    return {
                      backgroundColor: '#f0fdf4',
                      borderLeftColor: '#22c55e',
                    };
                  }
                  return {
                    backgroundColor: '#fef3c7',
                    borderLeftColor: '#f59e0b',
                  };
                })()}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2 rounded-full ${(() => {
                      if (rehearsal.isPromoted) return 'bg-blue-500';
                      if (rehearsal.status === 'Completed')
                        return 'bg-green-500';
                      return 'bg-yellow-500';
                    })()}`}
                  ></div>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      if (rehearsal.isPromoted) return '✅ Déjà promue';
                      return `Statut: ${rehearsal.status}`;
                    })()}
                  </span>
                  {rehearsal.isPromoted ? (
                    <span className="text-sm text-blue-600">
                      (Cette répétition a déjà été promue vers la performance)
                    </span>
                  ) : (
                    rehearsal.status !== 'Completed' && (
                      <span className="text-sm text-gray-600">
                        (La répétition doit être terminée pour être promue)
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-lg bg-gray-200 p-3">
                  <FaCalendarAlt className="mt-1 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Date et heure
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(rehearsal.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-200 p-3">
                  <FaMapMarkerAlt className="mt-1 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Lieu
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {rehearsal.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-200 p-3">
                  <FaClock className="mt-1 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Durée
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(rehearsal.duration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-200 p-3">
                  <FaUser className="mt-1 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Conducteur
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {rehearsal.rehearsalLead ? (
                        `${rehearsal.rehearsalLead.lastName} ${rehearsal.rehearsalLead.firstName}`
                      ) : (
                        <span className="italic text-gray-400">
                          Non assigné
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-200 p-3">
                  <FaUser className="mt-1 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Conducteur
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        if (rehearsal.shiftLead) {
                          return `${rehearsal.shiftLead.lastName} ${rehearsal.shiftLead.firstName}`;
                        }
                        return (
                          <span className="italic text-gray-400">
                            Non assigné
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-gray-200 p-3">
                  <FaStar className="text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Modèle réutilisable
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        if (rehearsal.isTemplate) {
                          return (
                            <span className="font-semibold text-green-600">
                              ✓ Oui
                            </span>
                          );
                        }
                        return <span className="text-gray-400">Non</span>;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-4 space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-gray-200 p-2">
                  <FaStar className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Détails supplémentaires
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {rehearsal.objectives && (
                  <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-blue-700">
                      Objectifs
                    </label>
                    <p className="text-sm text-gray-900">
                      {rehearsal.objectives}
                    </p>
                  </div>
                )}

                {rehearsal.notes && (
                  <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-yellow-700">
                      Notes
                    </label>
                    <p className="text-sm text-gray-900">{rehearsal.notes}</p>
                  </div>
                )}

                {rehearsal.feedback && (
                  <div className="rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-green-700">
                      Retour
                    </label>
                    <p className="text-sm text-gray-900">
                      {rehearsal.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rehearsal Songs */}
          {rehearsal.rehearsalSongs && rehearsal.rehearsalSongs.length > 0 && (
            <div className="mt-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <FaMusic className="text-xl text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Chansons de répétition
                </h3>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                  {songs.length} chanson{songs.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                            {song.order}
                          </div>
                          <h4 className="text-xl font-semibold text-gray-900">
                            {song.song.title}
                          </h4>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getDifficultyColor(song.difficulty)}`}
                          >
                            <FaStar className="text-xs" />
                            {song.difficulty}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getMusicalKeyColor()}`}
                          >
                            <FaMusic className="text-xs" />
                            {song.musicalKey}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800`}
                          >
                            Temps alloué: {song.timeAllocated} min
                          </span>
                          {song.needsWork && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                              <FaExclamationTriangle className="text-xs" />
                              Travail nécessaire
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-3 rounded-lg bg-gray-200 p-3">
                            <FaUser className="text-gray-400" />
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Chanteur(s) principal(aux)
                              </label>
                              <p className="text-sm font-medium text-gray-900">
                                {(() => {
                                  const leadSingers: string[] = [];
                                  let leadSingerIds: number[] = [];

                                  // First try to get leadSingerIds from the converted data
                                  if (
                                    song.leadSingerIds &&
                                    Array.isArray(song.leadSingerIds)
                                  ) {
                                    leadSingerIds = song.leadSingerIds;
                                  }
                                  // Try to get from rehearsalDetails.leadSingers
                                  else if (
                                    song.rehearsalDetails?.leadSingers &&
                                    Array.isArray(
                                      song.rehearsalDetails.leadSingers,
                                    )
                                  ) {
                                    leadSingerIds =
                                      song.rehearsalDetails.leadSingers.map(
                                        (ls: any) => ls.id,
                                      );
                                  }
                                  // Try to get from rehearsalDetails.leadSinger
                                  else if (
                                    song.rehearsalDetails?.leadSinger &&
                                    Array.isArray(
                                      song.rehearsalDetails.leadSinger,
                                    )
                                  ) {
                                    leadSingerIds =
                                      song.rehearsalDetails.leadSinger.map(
                                        (ls: any) => ls.id,
                                      );
                                  }
                                  // Try single leadSinger object
                                  else if (
                                    song.rehearsalDetails?.leadSinger &&
                                    !Array.isArray(
                                      song.rehearsalDetails.leadSinger,
                                    )
                                  ) {
                                    leadSingerIds = [
                                      song.rehearsalDetails.leadSinger.id,
                                    ];
                                  }
                                  // Try leadSingerId field
                                  else if (
                                    song.rehearsalDetails?.leadSingerId
                                  ) {
                                    leadSingerIds = [
                                      song.rehearsalDetails.leadSingerId,
                                    ];
                                  }
                                  // Fallback: Check if leadSingers or leadSinger is directly available
                                  else if (
                                    song.leadSingers &&
                                    Array.isArray(song.leadSingers)
                                  ) {
                                    leadSingerIds = song.leadSingers.map(
                                      (singer: any) => singer.id,
                                    );
                                  } else if (
                                    song.leadSinger &&
                                    Array.isArray(song.leadSinger)
                                  ) {
                                    leadSingerIds = song.leadSinger.map(
                                      (singer: any) => singer.id,
                                    );
                                  } else if (
                                    song.leadSinger &&
                                    !Array.isArray(song.leadSinger)
                                  ) {
                                    leadSingerIds = [song.leadSinger.id];
                                  }

                                  // Now process the leadSingerIds to get names
                                  leadSingerIds.forEach((id: number) => {
                                    if (id > 0) {
                                      const name = getUserName(id);
                                      if (name && !leadSingers.includes(name)) {
                                        leadSingers.push(name);
                                      }
                                    }
                                  });

                                  // Return result
                                  if (leadSingers.length > 0) {
                                    return leadSingers.join(', ');
                                  }

                                  // No lead singer assigned
                                  return (
                                    <span className="italic text-gray-400">
                                      Non assigné
                                    </span>
                                  );
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {song.focusPoints && (
                          <div className="mt-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-3">
                            <label className="mb-1 block text-sm font-medium text-blue-700">
                              Points de focus
                            </label>
                            <p className="text-sm text-gray-900">
                              {song.focusPoints}
                            </p>
                          </div>
                        )}

                        {song.notes && (
                          <div className="mt-3 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3">
                            <label className="mb-1 block text-sm font-medium text-yellow-700">
                              Notes
                            </label>
                            <p className="text-sm text-gray-900">
                              {song.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voice Parts */}
                    {song.voiceParts && song.voiceParts.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FaUsers className="text-purple-500" />
                          <h5 className="text-sm font-semibold text-gray-600">
                            Parties vocales
                          </h5>
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            {song.voiceParts.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {song.voiceParts.map((voicePart: any) => (
                            <div
                              key={voicePart.id}
                              className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-purple-800">
                                  {voicePart.voicePartType}
                                </span>
                                {voicePart.needsWork && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                    <FaExclamationTriangle className="text-xs" />
                                    Travail nécessaire
                                  </span>
                                )}
                              </div>

                              <div className="mb-2 text-sm text-gray-600">
                                {(() => {
                                  // Check if we have members array
                                  if (
                                    voicePart.members &&
                                    voicePart.members.length > 0
                                  ) {
                                    return (
                                      <div className="flex flex-wrap gap-1">
                                        {voicePart.members.map(
                                          (member: any) => (
                                            <span
                                              key={member.id}
                                              className="rounded bg-white px-2 py-1 text-xs font-medium"
                                            >
                                              {member.lastName}{' '}
                                              {member.firstName}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    );
                                  }

                                  // Check if we have memberIds array
                                  if (
                                    voicePart.memberIds &&
                                    voicePart.memberIds.length > 0
                                  ) {
                                    return (
                                      <div className="flex flex-wrap gap-1">
                                        {voicePart.memberIds.map(
                                          (memberId: number) => {
                                            const member = users.find(
                                              (u) => u.id === memberId,
                                            );
                                            return (
                                              <span
                                                key={memberId}
                                                className="rounded bg-white px-2 py-1 text-xs font-medium"
                                              >
                                                {member
                                                  ? `${member.lastName} ${member.firstName}`
                                                  : `User ${memberId}`}
                                              </span>
                                            );
                                          },
                                        )}
                                      </div>
                                    );
                                  }

                                  // No members found
                                  return (
                                    <div className="flex items-center gap-2">
                                      <span className="italic text-gray-400">
                                        Aucun membre assigné
                                      </span>
                                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                                        ⚠️ En cours de déploiement
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {voicePart.focusPoints && (
                                <div className="mt-2 rounded border-l-2 border-purple-300 bg-white p-2">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium text-purple-700">
                                      Focus:
                                    </span>{' '}
                                    {voicePart.focusPoints}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Musicians */}
                    {song.musicians && song.musicians.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FaMicrophone className="text-green-500" />
                          <h5 className="text-sm font-semibold text-gray-600">
                            Musiciens
                          </h5>
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-green-700">
                            {song.musicians.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {song.musicians.map((musician: any) => (
                            <div
                              key={musician.id}
                              className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-8 items-center justify-center rounded-full bg-gray-200">
                                    <span className="text-xs font-bold text-green-600">
                                      #{musician.order}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-semibold text-gray-800">
                                      {musician.user.lastName}{' '}
                                      {musician.user.firstName}
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm font-medium text-green-600">
                                        {musician.instrument}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {musician.isAccompanist && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                      <FaMusic className="text-xs" />
                                      Accompagnateur
                                    </span>
                                  )}
                                  {false && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                                      <FaStar className="text-xs" />
                                      Soliste
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rehearsal Musicians */}
          {rehearsal.musicians && rehearsal.musicians.length > 0 && (
            <div className="mt-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-gray-200 p-2">
                  <FaMicrophone className="text-xl text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Musiciens de la répétition
                </h3>
                <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-green-700">
                  {rehearsal.musicians.length} musicien
                  {rehearsal.musicians.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rehearsal.musicians.map((musician, index) => (
                  <div
                    key={musician.id || index}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-sm font-bold text-green-600">
                              {musician.user
                                ? `${musician.user.firstName.charAt(0)}${musician.user.lastName.charAt(0)}`
                                : '?'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {musician.user
                                ? `${musician.user.lastName} ${musician.user.firstName}`
                                : 'Utilisateur inconnu'}
                            </h4>
                            <p className="text-sm font-medium text-green-600">
                              {musician.customInstrument || musician.instrument}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {musician.isAccompanist && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              <FaMusic className="text-xs" />
                              Accompagnateur
                            </span>
                          )}
                          {musician.needsPractice && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                              <FaExclamationTriangle className="text-xs" />
                              Nécessite de la pratique
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {false &&
                        musician.soloStartTime &&
                        musician.soloEndTime && (
                          <div>
                            <span className="font-medium">Solo:</span>{' '}
                            {Math.floor((musician.soloStartTime || 0) / 60)}:
                            {(musician.soloStartTime || 0) % 60} -{' '}
                            {Math.floor((musician.soloEndTime || 0) / 60)}:
                            {(musician.soloEndTime || 0) % 60}
                          </div>
                        )}

                      {musician.timeAllocated && musician.timeAllocated > 0 && (
                        <div>
                          <span className="font-medium">Temps alloué:</span>{' '}
                          {musician.timeAllocated} min
                        </div>
                      )}

                      <div>
                        <span className="font-medium">Ordre:</span>{' '}
                        {musician.order}
                      </div>
                    </div>

                    {musician.soloNotes && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Notes de solo:</span>{' '}
                          {musician.soloNotes}
                        </p>
                      </div>
                    )}

                    {musician.accompanimentNotes && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">
                            Notes d&apos;accompagnement:
                          </span>{' '}
                          {musician.accompanimentNotes}
                        </p>
                      </div>
                    )}

                    {musician.practiceNotes && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">
                            Notes de pratique:
                          </span>{' '}
                          {musician.practiceNotes}
                        </p>
                      </div>
                    )}

                    {musician.notes && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Notes:</span>{' '}
                          {musician.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Choir Members */}
          {rehearsal.choirMembers && rehearsal.choirMembers.length > 0 && (
            <div className="mt-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FaUsers className="text-xl text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Membres du chœur
                </h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {rehearsal.choirMembers.length} membre
                  {rehearsal.choirMembers.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rehearsal.choirMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-bold text-blue-600">
                        {member.firstName.charAt(0)}
                        {member.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {member.lastName} {member.firstName}
                      </p>
                      {member.voiceCategory && (
                        <p className="text-xs font-medium text-blue-600">
                          {member.voiceCategory}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

RehearsalDetail.displayName = 'RehearsalDetail';

export default RehearsalDetail;
