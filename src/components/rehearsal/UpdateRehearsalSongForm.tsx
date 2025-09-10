import React, { memo, useEffect, useState } from 'react';
import {
  FaMicrophone,
  FaMusic,
  FaPlus,
  FaTimes,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import {
  getInstrumentOptions,
  getMusicalKeyOptions,
  getSongDifficultyOptions,
} from '@/lib/rehearsal/logic';
import { RehearsalService } from '@/lib/rehearsal/service';
import type {
  CreateRehearsalMusicianDto,
  CreateRehearsalSongDto,
  CreateRehearsalVoicePartDto,
  UpdateRehearsalSongDto,
} from '@/lib/rehearsal/types';
import {
  InstrumentType,
  MusicalKey,
  SongDifficulty,
} from '@/lib/rehearsal/types';
import { useUsers } from '@/lib/user/useUsers';

interface UpdateRehearsalSongFormProps {
  rehearsalId: number;
  songId: number; // Original Song ID (for display purposes)
  rehearsalSongId: number; // RehearsalSong ID (for API calls)
  initialData: CreateRehearsalSongDto;
  songTitle?: string;
  songComposer?: string;
  onSuccess: (updatedSong: CreateRehearsalSongDto) => void;
  onCancel: () => void;
}

interface UpdateSongFormState {
  // Basic info
  difficulty: SongDifficulty;
  needsWork: boolean;
  order: number;
  timeAllocated: number;
  focusPoints: string;
  notes: string;
  musicalKey: MusicalKey;

  // People
  leadSingerIds: number[];
  chorusMemberIds: number[];

  // Musicians
  musicians: CreateRehearsalMusicianDto[];

  // Voice parts
  voiceParts: CreateRehearsalVoicePartDto[];

  // UI state
  loading: boolean;
  errors: Record<string, string>;
  activeTab: string;
}

const rehearsalVoicePartOptions = [
  'Soprano',
  'Alto',
  'Tenor',
  'Bass',
  'Mezzo Soprano',
  'Baritone',
];

export const UpdateRehearsalSongForm: React.FC<UpdateRehearsalSongFormProps> =
  memo(
    ({
      rehearsalId,
      rehearsalSongId,
      initialData,
      songTitle,
      songComposer,
      onSuccess,
      onCancel,
    }) => {
      // Users are fetched via the centralized useUsers hook
      const { users } = useUsers();
      const [formData, setFormData] = useState<UpdateSongFormState>({
        difficulty: initialData.difficulty || SongDifficulty.INTERMEDIATE,
        needsWork: initialData.needsWork || false,
        order: initialData.order || 1,
        timeAllocated: initialData.timeAllocated || 30,
        focusPoints: initialData.focusPoints || '',
        notes: initialData.notes || '',
        musicalKey: initialData.musicalKey || MusicalKey.C,
        // Lead singer data - now properly supports multiple lead singers
        leadSingerIds: initialData.leadSingerIds || [],
        chorusMemberIds: initialData.chorusMemberIds || [],
        musicians: initialData.musicians
          ? initialData.musicians.map((musician) => ({
              ...musician,
              userId: musician.userId,
            }))
          : [],
        voiceParts: initialData.voiceParts
          ? initialData.voiceParts.map((voicePart) => ({
              ...voicePart,
              memberIds: voicePart.memberIds || [],
            }))
          : [],
        loading: false,
        errors: {},
        activeTab: 'basic',
      });

      const [showLeadSingerDropdown, setShowLeadSingerDropdown] =
        useState(false);
      const [showChorusMemberDropdown, setShowChorusMemberDropdown] =
        useState(false);
      const [leadSingerSearchTerm, setLeadSingerSearchTerm] = useState('');
      const [voicePartSearchTerms, setVoicePartSearchTerms] = useState<
        string[]
      >([]);
      const [showVoicePartDropdowns, setShowVoicePartDropdowns] = useState<
        Record<number, boolean>
      >({});

      useEffect(() => {
        if (initialData.musicians && initialData.musicians.length > 0) {
          const transformedMusicians = initialData.musicians.map(
            (musician) => ({
              ...musician,
              userId: musician.userId,
            }),
          );

          setFormData((prev) => ({
            ...prev,
            musicians: transformedMusicians,
          }));
        }

        if (initialData.voiceParts && initialData.voiceParts.length > 0) {
          const transformedVoiceParts = initialData.voiceParts.map(
            (voicePart) => ({
              ...voicePart,
              memberIds: voicePart.memberIds || [],
            }),
          );

          setFormData((prev) => ({
            ...prev,
            voiceParts: transformedVoiceParts,
          }));

          // Initialize search terms for voice parts
          const initialSearchTerms = new Array(
            transformedVoiceParts.length,
          ).fill('');
          setVoicePartSearchTerms(initialSearchTerms);
        }
      }, [initialData.musicians, initialData.voiceParts]);
      const [chorusMemberSearchTerm, setChorusMemberSearchTerm] = useState('');

      // Initialize form data when initialData changes
      useEffect(() => {
        setFormData({
          difficulty: initialData.difficulty || SongDifficulty.INTERMEDIATE,
          needsWork: initialData.needsWork || false,
          order: initialData.order || 1,
          timeAllocated: initialData.timeAllocated || 30,
          focusPoints: initialData.focusPoints || '',
          notes: initialData.notes || '',
          musicalKey: initialData.musicalKey || MusicalKey.C,
          leadSingerIds: initialData.leadSingerIds || [],
          chorusMemberIds: initialData.chorusMemberIds || [],
          musicians: initialData.musicians ? [...initialData.musicians] : [],
          voiceParts: initialData.voiceParts ? [...initialData.voiceParts] : [],
          loading: false,
          errors: {},
          activeTab: 'basic',
        });
      }, [initialData]);

      const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.difficulty) {
          errors.difficulty = 'Difficulty is required';
        }
        if (formData.order < 1) {
          errors.order = 'Order must be at least 1';
        }
        if (formData.timeAllocated < 0) {
          errors.timeAllocated = 'Time allocated cannot be negative';
        }
        if (!formData.musicalKey) {
          errors.musicalKey = 'Musical key is required';
        }

        formData.musicians.forEach((musician, index) => {
          if (!musician.instrument) {
            errors[`musician_${index}_instrument`] = 'Instrument is required';
          }
          if (
            musician.isSoloist &&
            musician.soloEndTime &&
            musician.soloStartTime &&
            musician.soloEndTime <= musician.soloStartTime
          ) {
            errors[`musician_${index}_solo_timing`] =
              'Solo end time must be after start time';
          }
        });

        formData.voiceParts.forEach((voicePart, index) => {
          if (!voicePart.voicePartType) {
            errors[`voicePart_${index}_type`] = 'Voice part type is required';
          }
          // Make member validation less strict - only validate if voice part exists
          if (
            voicePart.voicePartType &&
            (!voicePart.memberIds || voicePart.memberIds.length === 0)
          ) {
            errors[`voicePart_${index}_members`] =
              'At least one member is required';
          }
        });

        setFormData((prev) => ({ ...prev, errors }));
        return Object.keys(errors).length === 0;
      };

      const handleSubmit = async () => {
        if (!validateForm()) {
          return;
        }

        setFormData((prev) => ({ ...prev, loading: true }));

        try {
          const updateData: UpdateRehearsalSongDto = {
            leadSingerIds: formData.leadSingerIds,
            chorusMemberIds: formData.chorusMemberIds,
            musicians: formData.musicians,
            voiceParts: formData.voiceParts,
            difficulty: formData.difficulty,
            needsWork: formData.needsWork,
            order: formData.order,
            timeAllocated: formData.timeAllocated,
            focusPoints: formData.focusPoints,
            notes: formData.notes,
            musicalKey: formData.musicalKey,
          };

          const updatedSong = await RehearsalService.updateRehearsalSong(
            rehearsalId,
            rehearsalSongId,
            updateData,
          );

          // Return the API response data instead of form data
          onSuccess(updatedSong);
        } catch (error: any) {
          setFormData((prev) => ({
            ...prev,
            errors: {
              general:
                error.response?.data?.message ||
                error.message ||
                'Failed to update song',
            },
          }));
        } finally {
          setFormData((prev) => ({ ...prev, loading: false }));
        }
      };

      const updateField = (field: keyof UpdateSongFormState, value: any) => {
        setFormData((prev) => {
          const newData = { ...prev, [field]: value };
          if (prev.errors[field]) {
            newData.errors = { ...prev.errors, [field]: '' };
          }
          return newData;
        });
      };

      const handleLeadSingerToggle = (userId: number) => {
        setFormData((prev) => ({
          ...prev,
          leadSingerIds: prev.leadSingerIds.includes(userId)
            ? prev.leadSingerIds.filter((id) => id !== userId)
            : [...prev.leadSingerIds, userId],
        }));
      };

      const handleChorusMemberToggle = (userId: number) => {
        setFormData((prev) => ({
          ...prev,
          chorusMemberIds: prev.chorusMemberIds.includes(userId)
            ? prev.chorusMemberIds.filter((id) => id !== userId)
            : [...prev.chorusMemberIds, userId],
        }));
      };

      const addMusician = () => {
        const newMusician: CreateRehearsalMusicianDto = {
          userId: 0,
          instrument: InstrumentType.PIANO,
          customInstrument: '',
          isAccompanist: false,
          isSoloist: false,
          soloStartTime: 0,
          soloEndTime: 0,
          soloNotes: '',
          accompanimentNotes: '',
          needsPractice: false,
          practiceNotes: '',
          order: formData.musicians.length + 1,
          timeAllocated: 0,
          notes: '',
        };
        setFormData((prev) => ({
          ...prev,
          musicians: [...prev.musicians, newMusician],
        }));
      };

      const updateMusician = (index: number, field: string, value: any) => {
        setFormData((prev) => ({
          ...prev,
          musicians: prev.musicians.map((musician, i) =>
            i === index ? { ...musician, [field]: value } : musician,
          ),
        }));
      };

      const removeMusician = (index: number) => {
        setFormData((prev) => ({
          ...prev,
          musicians: prev.musicians.filter((_, i) => i !== index),
        }));
      };

      const addVoicePart = () => {
        const newVoicePart: CreateRehearsalVoicePartDto = {
          voicePartType: 'Soprano',
          memberIds: [],
          needsWork: false,
          focusPoints: '',
          notes: '',
        };
        setFormData((prev) => ({
          ...prev,
          voiceParts: [...prev.voiceParts, newVoicePart],
        }));

        // Add search term for the new voice part
        setVoicePartSearchTerms((prev) => [...prev, '']);
      };

      const updateVoicePart = (index: number, field: string, value: any) => {
        setFormData((prev) => ({
          ...prev,
          voiceParts: prev.voiceParts.map((voicePart, i) =>
            i === index ? { ...voicePart, [field]: value } : voicePart,
          ),
        }));
      };

      const removeVoicePart = (index: number) => {
        setFormData((prev) => ({
          ...prev,
          voiceParts: prev.voiceParts.filter((_, i) => i !== index),
        }));

        // Remove search term for the removed voice part
        setVoicePartSearchTerms((prev) => prev.filter((_, i) => i !== index));

        // Remove dropdown state for the removed voice part
        setShowVoicePartDropdowns((prev) => {
          const newState = { ...prev };
          delete newState[index];
          // Shift down the indices for voice parts after the removed one
          const shiftedState: Record<number, boolean> = {};
          Object.keys(newState).forEach((key) => {
            const idx = parseInt(key, 10);
            if (idx > index) {
              shiftedState[idx - 1] = newState[idx] ?? false;
            } else {
              shiftedState[idx] = newState[idx] ?? false;
            }
          });
          return shiftedState;
        });
      };

      // Clear functions for each section
      const clearLeadSingers = () => {
        setFormData((prev) => ({
          ...prev,
          leadSingerIds: [],
        }));
      };

      const clearChorusMembers = () => {
        setFormData((prev) => ({
          ...prev,
          chorusMemberIds: [],
        }));
      };

      const clearMusicians = () => {
        setFormData((prev) => ({
          ...prev,
          musicians: [],
        }));
      };

      const clearVoiceParts = () => {
        setFormData((prev) => ({
          ...prev,
          voiceParts: [],
        }));
        setVoicePartSearchTerms([]);
        setShowVoicePartDropdowns({});
      };

      const getSelectedUserName = (userId: number) => {
        // Don't render if users are not loaded yet
        if (!users || users.length === 0) {
          return 'Chargement...';
        }

        const user = users.find((u) => u.id === userId);
        if (user) {
          return `${user.firstName} ${user.lastName}`;
        }
        return 'Utilisateur inconnu';
      };

      const tabs = [
        { id: 'basic', label: 'Informations de base', icon: FaMusic },
        { id: 'people', label: 'Personnes', icon: FaUsers },
        { id: 'musicians', label: 'Musiciens', icon: FaMicrophone },
        { id: 'voiceParts', label: 'Parties vocales', icon: FaUsers },
      ];

      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not on the modal content
            if (e.target === e.currentTarget) {
              onCancel();
            }
          }}
        >
          <div
            className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl md:w-[90%]"
            onClick={(e) => {
              // Prevent clicks inside the modal from bubbling up
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Modifier les détails de répétition
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Mise à jour des propriétés spécifiques à la répétition (la
                  chanson ne peut pas être changée)
                </p>
              </div>
              <button
                onClick={() => {
                  onCancel();
                }}
                className="rounded-md bg-red-500 px-4 py-2 text-gray-400 transition-colors hover:text-gray-600"
              >
                <FaTimes className="text-lg text-white" />
              </button>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateField('activeTab', tab.id);
                      }}
                      className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                        formData.activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="size-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FaMusic className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chanson sélectionnée
                  </h3>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                    ⚠️ Lecture seule
                  </span>
                </div>
                <div className="text-gray-700">
                  <p className="text-lg font-medium">
                    🎵 {songTitle || 'Titre non disponible'}
                  </p>
                  <p className="text-sm text-gray-600">
                    par {songComposer || 'Compositeur non disponible'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Cette chanson ne peut pas être changée. Seules les
                    propriétés spécifiques à la répétition peuvent être
                    modifiées.
                  </p>
                </div>
              </div>

              {formData.errors.general && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-red-600">{formData.errors.general}</p>
                </div>
              )}

              {formData.activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Difficulté *
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) =>
                          updateField(
                            'difficulty',
                            e.target.value as SongDifficulty,
                          )
                        }
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formData.errors.difficulty
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        {getSongDifficultyOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formData.errors.difficulty && (
                        <p className="mt-1 text-sm text-red-600">
                          {formData.errors.difficulty}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Clé musicale *
                      </label>
                      <select
                        value={formData.musicalKey}
                        onChange={(e) =>
                          updateField(
                            'musicalKey',
                            e.target.value as MusicalKey,
                          )
                        }
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formData.errors.musicalKey
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        {getMusicalKeyOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formData.errors.musicalKey && (
                        <p className="mt-1 text-sm text-red-600">
                          {formData.errors.musicalKey}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Ordre *
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          updateField(
                            'order',
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        min="1"
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formData.errors.order
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      />
                      {formData.errors.order && (
                        <p className="mt-1 text-sm text-red-600">
                          {formData.errors.order}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Temps alloué (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.timeAllocated}
                        onChange={(e) =>
                          updateField(
                            'timeAllocated',
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        min="0"
                        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formData.errors.timeAllocated
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      />
                      {formData.errors.timeAllocated && (
                        <p className="mt-1 text-sm text-red-600">
                          {formData.errors.timeAllocated}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="needsWork"
                      checked={formData.needsWork}
                      onChange={(e) =>
                        updateField('needsWork', e.target.checked)
                      }
                      className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="needsWork"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Nécessite du travail
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Points de focus
                    </label>
                    <textarea
                      value={formData.focusPoints}
                      onChange={(e) =>
                        updateField('focusPoints', e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Points spécifiques à travailler..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes supplémentaires..."
                    />
                  </div>
                </div>
              )}

              {formData.activeTab === 'people' &&
                (() => {
                  // Show loading state if users are not loaded yet
                  if (!users || users.length === 0) {
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="text-gray-600">
                              Chargement des utilisateurs...
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Chanteurs principaux
                          </label>
                          {formData.leadSingerIds.length > 0 && (
                            <button
                              type="button"
                              onClick={clearLeadSingers}
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Effacer tout
                            </button>
                          )}
                        </div>

                        <div className="mb-3">
                          {formData.leadSingerIds.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.leadSingerIds.map((singerId) => (
                                <span
                                  key={singerId}
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"
                                >
                                  {getSelectedUserName(singerId)}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleLeadSingerToggle(singerId)
                                    }
                                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Aucun chanteur principal sélectionné
                            </p>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={leadSingerSearchTerm}
                            onChange={(e) => {
                              setLeadSingerSearchTerm(e.target.value);
                              setShowLeadSingerDropdown(true);
                            }}
                            placeholder="Rechercher des chanteurs..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onFocus={() => setShowLeadSingerDropdown(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowLeadSingerDropdown(false),
                                200,
                              )
                            }
                          />
                          {showLeadSingerDropdown && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              {users
                                .filter(
                                  (user) =>
                                    !formData.leadSingerIds.includes(user.id) &&
                                    `${user.firstName} ${user.lastName}`
                                      .toLowerCase()
                                      .includes(
                                        leadSingerSearchTerm.toLowerCase(),
                                      ),
                                )
                                .map((user) => (
                                  <div
                                    key={user.id}
                                    className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleLeadSingerToggle(user.id);
                                      setLeadSingerSearchTerm('');
                                    }}
                                  >
                                    {user.firstName} {user.lastName}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Membres du chœur
                          </label>
                          {formData.chorusMemberIds.length > 0 && (
                            <button
                              type="button"
                              onClick={clearChorusMembers}
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Effacer tout
                            </button>
                          )}
                        </div>

                        <div className="mb-3">
                          {formData.chorusMemberIds.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.chorusMemberIds.map((memberId) => (
                                <span
                                  key={memberId}
                                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-sm text-green-800"
                                >
                                  {getSelectedUserName(memberId)}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChorusMemberToggle(memberId)
                                    }
                                    className="ml-1 text-green-600 hover:text-green-800 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Aucun membre du chœur sélectionné
                            </p>
                          )}
                        </div>

                        {/* Chorus Member Selection */}
                        <div className="relative">
                          <input
                            type="text"
                            value={chorusMemberSearchTerm}
                            onChange={(e) => {
                              setChorusMemberSearchTerm(e.target.value);
                              setShowChorusMemberDropdown(true);
                            }}
                            placeholder="Rechercher des membres..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onFocus={() => setShowChorusMemberDropdown(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowChorusMemberDropdown(false),
                                200,
                              )
                            }
                          />
                          {showChorusMemberDropdown && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              {users
                                .filter(
                                  (user) =>
                                    !formData.chorusMemberIds.includes(
                                      user.id,
                                    ) &&
                                    `${user.firstName} ${user.lastName}`
                                      .toLowerCase()
                                      .includes(
                                        chorusMemberSearchTerm.toLowerCase(),
                                      ),
                                )
                                .map((user) => (
                                  <div
                                    key={user.id}
                                    className="cursor-pointer px-3 py-2 hover:bg-green-50"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleChorusMemberToggle(user.id);
                                      setChorusMemberSearchTerm('');
                                    }}
                                  >
                                    {user.firstName} {user.lastName}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Musicians Tab */}
              {formData.activeTab === 'musicians' && (
                <div className="space-y-6">
                  {(!users || users.length === 0) && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">
                          Chargement des utilisateurs...
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Musiciens
                    </h3>
                    <div className="flex items-center gap-2">
                      {formData.musicians.length > 0 && (
                        <button
                          type="button"
                          onClick={clearMusicians}
                          className="flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <FaTrash />
                          Effacer tout
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addMusician}
                        className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <FaPlus />
                        Ajouter un musicien
                      </button>
                    </div>
                  </div>

                  {formData.musicians.map((musician, index) => {
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            Musicien #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeMusician(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Instrument *
                            </label>
                            <select
                              value={musician.instrument}
                              onChange={(e) =>
                                updateMusician(
                                  index,
                                  'instrument',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {getInstrumentOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Utilisateur
                              {!musician.userId && (
                                <span className="ml-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                                  Non assigné
                                </span>
                              )}
                            </label>
                            <select
                              value={musician.userId || 0}
                              onChange={(e) =>
                                updateMusician(
                                  index,
                                  'userId',
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={0}>
                                Sélectionner un utilisateur...
                              </option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={musician.isAccompanist || false}
                                  onChange={(e) =>
                                    updateMusician(
                                      index,
                                      'isAccompanist',
                                      e.target.checked,
                                    )
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Accompagnateur
                                </span>
                              </label>

                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={musician.isSoloist || false}
                                  onChange={(e) =>
                                    updateMusician(
                                      index,
                                      'isSoloist',
                                      e.target.checked,
                                    )
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Soliste
                                </span>
                              </label>

                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={musician.needsPractice || false}
                                  onChange={(e) =>
                                    updateMusician(
                                      index,
                                      'needsPractice',
                                      e.target.checked,
                                    )
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Nécessite de la pratique
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Notes
                            </label>
                            <textarea
                              value={musician.notes || ''}
                              onChange={(e) =>
                                updateMusician(index, 'notes', e.target.value)
                              }
                              rows={2}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Notes sur ce musicien..."
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Notes de pratique
                            </label>
                            <textarea
                              value={musician.practiceNotes || ''}
                              onChange={(e) =>
                                updateMusician(
                                  index,
                                  'practiceNotes',
                                  e.target.value,
                                )
                              }
                              rows={2}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Notes de pratique..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {formData.musicians.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <FaMicrophone className="mx-auto mb-4 size-12 text-gray-400" />
                      <p>Aucun musicien assigné</p>
                      <p className="text-sm">
                        Cliquez sur &quot;Ajouter un musicien&quot; pour
                        commencer
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Voice Parts Tab */}
              {formData.activeTab === 'voiceParts' && (
                <div className="space-y-6">
                  {(!users || users.length === 0) && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">
                          Chargement des utilisateurs...
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Parties vocales
                    </h3>
                    <div className="flex items-center gap-2">
                      {formData.voiceParts.length > 0 && (
                        <button
                          type="button"
                          onClick={clearVoiceParts}
                          className="flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <FaTrash />
                          Effacer tout
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addVoicePart}
                        className="flex items-center gap-2 rounded-md bg-purple-100 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <FaPlus />
                        Ajouter une partie vocale
                      </button>
                    </div>
                  </div>

                  {formData.voiceParts.map((voicePart, index) => {
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            Partie vocale #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeVoicePart(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Type de partie *
                            </label>
                            <select
                              value={voicePart.voicePartType}
                              onChange={(e) =>
                                updateVoicePart(
                                  index,
                                  'voicePartType',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {rehearsalVoicePartOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Membres *
                              {(!voicePart.memberIds ||
                                voicePart.memberIds.length === 0) && (
                                <span className="ml-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                                  Aucun membre assigné
                                </span>
                              )}
                            </label>

                            {/* Selected Members Display */}
                            <div className="mb-3">
                              {voicePart.memberIds &&
                              voicePart.memberIds.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {voicePart.memberIds.map((memberId) => (
                                    <span
                                      key={memberId}
                                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-sm text-purple-800"
                                    >
                                      {getSelectedUserName(memberId)}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedMemberIds =
                                            voicePart.memberIds?.filter(
                                              (id) => id !== memberId,
                                            ) || [];
                                          updateVoicePart(
                                            index,
                                            'memberIds',
                                            updatedMemberIds,
                                          );
                                        }}
                                        className="ml-1 text-purple-600 hover:text-purple-800 focus:outline-none"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Aucun membre sélectionné
                                </p>
                              )}
                            </div>

                            {/* Member Search and Selection */}
                            <div className="relative">
                              <input
                                type="text"
                                value={voicePartSearchTerms[index] || ''}
                                onChange={(e) => {
                                  const newSearchTerms = [
                                    ...voicePartSearchTerms,
                                  ];
                                  newSearchTerms[index] = e.target.value;
                                  setVoicePartSearchTerms(newSearchTerms);
                                  setShowVoicePartDropdowns((prev) => ({
                                    ...prev,
                                    [index]: true,
                                  }));
                                }}
                                placeholder="Rechercher des membres..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onFocus={() =>
                                  setShowVoicePartDropdowns((prev) => ({
                                    ...prev,
                                    [index]: true,
                                  }))
                                }
                                onBlur={() =>
                                  setTimeout(
                                    () =>
                                      setShowVoicePartDropdowns((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      })),
                                    200,
                                  )
                                }
                              />
                              {showVoicePartDropdowns[index] && (
                                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                                  {users
                                    .filter(
                                      (user) =>
                                        !voicePart.memberIds?.includes(
                                          user.id,
                                        ) &&
                                        `${user.firstName} ${user.lastName}`
                                          .toLowerCase()
                                          .includes(
                                            (
                                              voicePartSearchTerms[index] || ''
                                            ).toLowerCase(),
                                          ),
                                    )
                                    .map((user) => (
                                      <div
                                        key={user.id}
                                        className="cursor-pointer px-3 py-2 hover:bg-purple-50"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const currentMemberIds =
                                            voicePart.memberIds || [];
                                          const updatedMemberIds = [
                                            ...currentMemberIds,
                                            user.id,
                                          ];
                                          updateVoicePart(
                                            index,
                                            'memberIds',
                                            updatedMemberIds,
                                          );
                                          const newSearchTerms = [
                                            ...voicePartSearchTerms,
                                          ];
                                          newSearchTerms[index] = '';
                                          setVoicePartSearchTerms(
                                            newSearchTerms,
                                          );
                                        }}
                                      >
                                        {user.firstName} {user.lastName}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Points de focus
                            </label>
                            <textarea
                              value={voicePart.focusPoints || ''}
                              onChange={(e) =>
                                updateVoicePart(
                                  index,
                                  'focusPoints',
                                  e.target.value,
                                )
                              }
                              rows={2}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Points spécifiques à travailler..."
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Notes
                            </label>
                            <textarea
                              value={voicePart.notes || ''}
                              onChange={(e) =>
                                updateVoicePart(index, 'notes', e.target.value)
                              }
                              rows={2}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Notes supplémentaires..."
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={voicePart.needsWork || false}
                                onChange={(e) =>
                                  updateVoicePart(
                                    index,
                                    'needsWork',
                                    e.target.checked,
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Nécessite du travail
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {formData.voiceParts.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <FaUsers className="mx-auto mb-4 size-12 text-gray-400" />
                      <p>Aucune partie vocale assignée</p>
                      <p className="text-sm">
                        Cliquez sur &quot;Ajouter une partie vocale&quot; pour
                        commencer
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between border-t border-gray-200 p-6">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    onCancel();
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formData.loading}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSubmit();
                  }}
                  disabled={formData.loading}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formData.loading ? (
                    <div className="flex items-center">
                      <svg
                        className="-ml-1 mr-2 size-4 animate-spin text-white"
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
                      Sauvegarde...
                    </div>
                  ) : (
                    'Sauvegarder les modifications'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    },
  );

UpdateRehearsalSongForm.displayName = 'UpdateRehearsalSongForm';

export default UpdateRehearsalSongForm;
