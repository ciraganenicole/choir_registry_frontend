import React, { useState } from 'react';
import { FaCheck, FaClock, FaPause, FaPlay, FaStop } from 'react-icons/fa';

import type { Rehearsal, RehearsalSong } from '@/lib/rehearsal/types';
import { RehearsalStatus } from '@/lib/rehearsal/types';

interface RehearsalProgressTrackerProps {
  rehearsal: Rehearsal;
  onStatusUpdate?: (status: string) => void;
  onObjectiveComplete?: (objectiveId: string, completed: boolean) => void;
  onSongProgress?: (songId: number, progress: number) => void;
}

export const RehearsalProgressTracker: React.FC<
  RehearsalProgressTrackerProps
> = ({ rehearsal, onStatusUpdate, onObjectiveComplete, onSongProgress }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedObjectives, setCompletedObjectives] = useState<Set<string>>(
    new Set(),
  );
  const [songProgress, setSongProgress] = useState<Record<number, number>>({});

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && currentTime < rehearsal.duration * 60) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentTime, rehearsal.duration]);

  const startTimer = () => {
    setIsRunning(true);
    onStatusUpdate?.('in_progress');
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setCurrentTime(0);
    onStatusUpdate?.('completed');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.min((currentTime / (rehearsal.duration * 60)) * 100, 100);
  };

  const handleObjectiveToggle = (objectiveId: string) => {
    const newCompleted = new Set(completedObjectives);
    if (newCompleted.has(objectiveId)) {
      newCompleted.delete(objectiveId);
    } else {
      newCompleted.add(objectiveId);
    }
    setCompletedObjectives(newCompleted);
    onObjectiveComplete?.(objectiveId, newCompleted.has(objectiveId));
  };

  const handleSongProgress = (songId: number, progress: number) => {
    setSongProgress((prev) => ({ ...prev, [songId]: progress }));
    onSongProgress?.(songId, progress);
  };

  const getSongProgress = (song: RehearsalSong) => {
    return songProgress[song.id] || 0;
  };

  const getOverallProgress = () => {
    if (!rehearsal.rehearsalSongs || rehearsal.rehearsalSongs.length === 0) {
      return 0;
    }

    const totalProgress = rehearsal.rehearsalSongs.reduce((sum, song) => {
      return sum + getSongProgress(song);
    }, 0);

    return Math.round(totalProgress / rehearsal.rehearsalSongs.length);
  };

  return (
    <div className="space-y-6">
      {/* Timer and Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Suivi de la répétition
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${(() => {
                if (rehearsal.status === RehearsalStatus.PLANNING)
                  return 'bg-blue-100 text-blue-800';
                if (rehearsal.status === RehearsalStatus.IN_PROGRESS)
                  return 'bg-yellow-100 text-yellow-800';
                if (rehearsal.status === RehearsalStatus.COMPLETED)
                  return 'bg-green-100 text-green-800';
                return 'bg-gray-100 text-gray-800';
              })()}`}
            >
              {(() => {
                if (rehearsal.status === RehearsalStatus.PLANNING)
                  return 'Planification';
                if (rehearsal.status === RehearsalStatus.IN_PROGRESS)
                  return 'En cours';
                if (rehearsal.status === RehearsalStatus.COMPLETED)
                  return 'Terminé';
                return 'Annulé';
              })()}
            </span>
          </div>
        </div>

        {/* Timer Display */}
        <div className="mb-6 text-center">
          <div className="mb-2 font-mono text-4xl font-bold text-gray-900">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-600">
            Durée totale: {rehearsal.duration} minutes
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>Progression</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={rehearsal.status === RehearsalStatus.COMPLETED}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlay />
              Commencer
            </button>
          ) : (
            <>
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-3 text-white hover:bg-yellow-700"
              >
                <FaPause />
                Pause
              </button>
              <button
                onClick={stopTimer}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
              >
                <FaStop />
                Terminer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Objectives Progress */}
      {rehearsal.objectives && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 text-lg font-medium text-gray-900">Objectifs</h4>
          <div className="space-y-3">
            {rehearsal.objectives.split(',').map((objective, index) => {
              const objectiveId = `objective-${index}`;
              const isCompleted = completedObjectives.has(objectiveId);

              return (
                <div key={objectiveId} className="flex items-center gap-3">
                  <button
                    onClick={() => handleObjectiveToggle(objectiveId)}
                    className={`flex size-5 items-center justify-center rounded border-2 transition-colors ${
                      isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {isCompleted && <FaCheck className="size-3" />}
                  </button>
                  <span
                    className={`flex-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}
                  >
                    {objective.trim()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Objectifs complétés</span>
              <span>
                {completedObjectives.size} /{' '}
                {rehearsal.objectives.split(',').length}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-600 transition-all duration-300"
                style={{
                  width: `${(completedObjectives.size / rehearsal.objectives.split(',').length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Songs Progress */}
      {rehearsal.rehearsalSongs && rehearsal.rehearsalSongs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 text-lg font-medium text-gray-900">
            Progression des chansons
          </h4>
          <div className="space-y-4">
            {rehearsal.rehearsalSongs.map((song) => (
              <div
                key={song.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-blue-500" />
                    <span className="font-medium">
                      {song.song?.title || `Chanson ${song.order}`}
                    </span>
                    <span className="text-sm text-gray-500">
                      {song.timeAllocated} min
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {getSongProgress(song)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${getSongProgress(song)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button
                      onClick={() =>
                        handleSongProgress(
                          song.id,
                          Math.max(0, getSongProgress(song) - 25),
                        )
                      }
                      className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                    >
                      -25%
                    </button>
                    <button
                      onClick={() =>
                        handleSongProgress(
                          song.id,
                          Math.min(100, getSongProgress(song) + 25),
                        )
                      }
                      className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                    >
                      +25%
                    </button>
                    <button
                      onClick={() => handleSongProgress(song.id, 100)}
                      className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                    >
                      Terminé
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Progression globale</span>
              <span>{getOverallProgress()}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-600 transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes and Feedback */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="mb-4 text-lg font-medium text-gray-900">
          Notes et feedback
        </h4>
        <div className="space-y-4">
          {rehearsal.notes && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <div className="rounded-md bg-gray-50 p-3 text-gray-700">
                {rehearsal.notes}
              </div>
            </div>
          )}

          {rehearsal.feedback && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Feedback
              </label>
              <div className="rounded-md bg-blue-50 p-3 text-blue-700">
                {rehearsal.feedback}
              </div>
            </div>
          )}

          {!rehearsal.feedback && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ajouter du feedback
              </label>
              <textarea
                placeholder="Ajoutez vos observations et suggestions d'amélioration..."
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
