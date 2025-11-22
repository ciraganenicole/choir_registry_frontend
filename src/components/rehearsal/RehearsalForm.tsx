import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import Select from 'react-select';

import { usePerformances } from '@/lib/performance/logic';
import {
  getRehearsalTypeOptions,
  useCreateRehearsal,
  useUpdateRehearsal,
} from '@/lib/rehearsal/logic';
import { RehearsalService } from '@/lib/rehearsal/service';
import type {
  CreateRehearsalDto,
  CreateRehearsalSongDto,
  Rehearsal,
  UpdateRehearsalDto,
} from '@/lib/rehearsal/types';
import { RehearsalType } from '@/lib/rehearsal/types';
import {
  getActualShiftStatus,
  useCurrentShift,
  validateShiftForPerformance,
} from '@/lib/shift/logic';
import { UserCategory } from '@/lib/user/type';
import { useUsers } from '@/lib/user/useUsers';
import { useAuth } from '@/providers/AuthProvider';

import { RehearsalSongManager } from './RehearsalSongManager';

interface RehearsalFormProps {
  rehearsal?: Rehearsal | null;
  performanceId?: number; // Make optional
  onSuccess?: () => void;
  onCancel?: () => void;
  show?: boolean; // Control modal visibility
}

export const RehearsalForm: React.FC<RehearsalFormProps> = ({
  rehearsal,
  performanceId,
  onSuccess,
  onCancel,
  show = true,
}) => {
  const { user } = useAuth();
  const { createRehearsal } = useCreateRehearsal();
  const { updateRehearsal } = useUpdateRehearsal();
  const { currentShift } = useCurrentShift();
  // isEditing is true only when we have a rehearsal with an ID (existing rehearsal)
  // If we have a rehearsal without ID, it's a template for creating a new one
  const isEditing = !!(rehearsal && rehearsal.id);
  const isTemplateMode = !!(rehearsal && !rehearsal.id);

  const [formData, setFormData] = useState<CreateRehearsalDto>({
    title: '',
    date: '',
    type: RehearsalType.GENERAL_PRACTICE,
    location: '',
    duration: 60,
    performanceId: performanceId || 0, // Use provided performanceId or 0 if not provided
    rehearsalLeadId: 0,
    shiftLeadId: currentShift?.leaderId || 0, // Use current shift leader ID, default to 0 if no shift
    isTemplate: false,
    notes: '',
    objectives: '',
    rehearsalSongs: [],
    musicians: [],
  });

  // Instrument dropdown functionality removed as it's not used

  const { users: allUsers } = useUsers();
  const leaders = allUsers.filter((leader) =>
    leader.categories?.includes(UserCategory.LEAD),
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [isRehearsalSaved, setIsRehearsalSaved] = useState(false);
  const [savedRehearsalId, setSavedRehearsalId] = useState<number | null>(null);
  const {
    performances,
    fetchPerformances,
    loading: performancesLoading,
    error: performancesError,
  } = usePerformances();

  // Fetch performances when component mounts (only if no performanceId is provided)
  useEffect(() => {
    if (!performanceId) {
      fetchPerformances({}, { page: 1, limit: 1000 });
    }
  }, [performanceId, fetchPerformances]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize form data when editing
  useEffect(() => {
    if (rehearsal) {
      setIsRehearsalSaved(true);
      setSavedRehearsalId(rehearsal.id);

      let dateString = '';
      if (rehearsal.date) {
        if (typeof rehearsal.date === 'string') {
          dateString = rehearsal.date.split('T')[0] || '';
        } else if (rehearsal.date instanceof Date) {
          dateString = rehearsal.date.toISOString().split('T')[0] || '';
        } else {
          dateString =
            new Date(rehearsal.date).toISOString().split('T')[0] || '';
        }
      }

      setFormData({
        title: rehearsal.title || '',
        date: dateString,
        type: rehearsal.type || RehearsalType.GENERAL_PRACTICE,
        location: rehearsal.location || '',
        duration: rehearsal.duration || 60,
        performanceId: rehearsal.performanceId,
        rehearsalLeadId: rehearsal.rehearsalLeadId || 0,
        shiftLeadId: rehearsal.shiftLeadId || 0,
        isTemplate: rehearsal.isTemplate || false,
        notes: rehearsal.notes || '',
        objectives: rehearsal.objectives || '',
        rehearsalSongs:
          rehearsal.rehearsalSongs?.map((song) => ({
            songId: song.songId,
            leadSingerIds: song.leadSingers?.map((ls) => ls.id) || [],
            difficulty: song.difficulty,
            needsWork: song.needsWork,
            order: song.order,
            timeAllocated: song.timeAllocated,
            focusPoints: song.focusPoints,
            notes: song.notes,
            musicalKey: song.musicalKey,
            voiceParts:
              song.voiceParts?.map((vp) => ({
                voicePartType: vp.voicePartType,
                memberIds: vp.members?.map((m) => m.id) || [],
                needsWork: vp.needsWork,
                focusPoints: vp.focusPoints,
                notes: vp.notes,
              })) || [],
            musicians:
              song.musicians?.map((m) => ({
                userId: m.userId,
                instrument: m.instrument,
                customInstrument: '',
                isAccompanist: m.isAccompanist,
                isSoloist: false,
                soloStartTime: 0,
                soloEndTime: 0,
                soloNotes: '',
                accompanimentNotes: '',
                needsPractice: false,
                practiceNotes: '',
                order: m.order,
                timeAllocated: 0,
                notes: m.notes || '',
              })) || [],
            chorusMemberIds: song.chorusMembers?.map((cm) => cm.id) || [],
          })) || [],
        musicians: rehearsal.musicians || [],
      });
    }
  }, [rehearsal]);

  // Update shiftLeadId and rehearsalLeadId when current shift changes
  useEffect(() => {
    if (currentShift?.leaderId && !rehearsal) {
      setFormData((prev) => ({
        ...prev,
        shiftLeadId: currentShift.leaderId,
        rehearsalLeadId: currentShift.leaderId,
      }));
    } else if (currentShift?.leaderId && rehearsal) {
      setFormData((prev) => ({
        ...prev,
        shiftLeadId: prev.shiftLeadId || currentShift.leaderId,
        rehearsalLeadId: prev.rehearsalLeadId || currentShift.leaderId,
      }));
    }
  }, [currentShift?.leaderId, rehearsal]);

  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    if (currentShift) {
      const shiftValidation = validateShiftForPerformance([currentShift]);

      if (!shiftValidation.canProceed) {
        errors.general = shiftValidation.warning || 'Shift validation failed';
        setValidationErrors(errors);
        return false;
      }
    }

    // Make shift validation more flexible - allow creation without active shift but with warning
    if (!currentShift) {
    } else {
      if (!currentShift.leaderId) {
        errors.general = 'Aucun conducteur de service assigné au shift';
        setValidationErrors(errors);
        return false;
      }

      const actualStatus = getActualShiftStatus(currentShift);
      if (actualStatus === 'Completed' || actualStatus === 'Cancelled') {
        errors.general =
          'Ce shift est terminé ou annulé, impossible de créer une répétition';
        setValidationErrors(errors);
        return false;
      }
    }

    if (!formData.date) {
      errors.date = 'La date est requise';
    }

    if (!formData.location.trim()) {
      errors.location = 'Le lieu est requis';
    }

    if (!formData.duration || formData.duration <= 0) {
      errors.duration = 'La durée doit être supérieure à 0';
    }

    if (!formData.rehearsalLeadId) {
      errors.rehearsalLeadId =
        'Veuillez sélectionner un conducteur de répétition';
    }

    // Only require shiftLeadId if there's an active shift
    if (currentShift && !formData.shiftLeadId) {
      errors.shiftLeadId = 'Veuillez sélectionner un conducteur de service';
    }

    // Validate performanceId if no performanceId is provided in props
    if (
      !performanceId &&
      (!formData.performanceId || formData.performanceId === 0)
    ) {
      errors.performanceId = 'Veuillez sélectionner une performance';
    }

    if (!isRehearsalSaved && !isEditing) {
      const totalSongTime = (formData.rehearsalSongs || []).reduce(
        (total, song) => total + (song.timeAllocated || 0),
        0,
      );
      if (totalSongTime > formData.duration) {
        errors.songs = `Le temps total des chansons (${totalSongTime} min) dépasse la durée de la répétition (${formData.duration} min)`;
      }
    }

    if (!isRehearsalSaved && !isEditing) {
      const songsWithErrors = (formData.rehearsalSongs || []).filter(
        (song) =>
          !song.songId ||
          !song.leadSingerIds ||
          song.leadSingerIds.length === 0,
      );
      if (songsWithErrors.length > 0) {
        errors.songs =
          'Toutes les chansons doivent avoir une chanson sélectionnée et un chanteur principal';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = parseInt(value, 10) || 0;
    } else if (name === 'isTemplate') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSongsChange = (songs: CreateRehearsalSongDto[]) => {
    setFormData((prev) => ({
      ...prev,
      rehearsalSongs: songs,
    }));

    if (validationErrors.songs) {
      setValidationErrors((prev) => ({
        ...prev,
        songs: '',
      }));
    }
  };

  const addSongsToRehearsal = async (
    rehearsalId: number,
    songs: CreateRehearsalSongDto[],
  ) => {
    const results = await RehearsalService.addMultipleSongsToRehearsal(
      rehearsalId,
      songs,
    );
    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    try {
      if (isEditing) {
        if (!rehearsal || !rehearsal.id) {
          return;
        }

        const updateData: UpdateRehearsalDto = {
          title: formData.title,
          date: formData.date,
          type: formData.type,
          location: formData.location,
          duration: formData.duration,
          rehearsalLeadId: formData.rehearsalLeadId,
          shiftLeadId: formData.shiftLeadId,
          notes: formData.notes,
          objectives: formData.objectives,
          musicians: formData.musicians,
        };

        const success = await updateRehearsal(rehearsal.id, updateData);
        if (success) {
          toast.success('Répétition modifiée avec succès');
          onSuccess?.();
        }
      } else if (isRehearsalSaved && savedRehearsalId) {
        if (formData.rehearsalSongs && formData.rehearsalSongs.length > 0) {
          await addSongsToRehearsal(savedRehearsalId, formData.rehearsalSongs);
        }

        toast.success('Chansons ajoutées avec succès à la répétition');
        onSuccess?.();
      } else {
        const rehearsalDataWithoutSongs = {
          ...formData,
          rehearsalSongs: undefined,
        };

        const createdRehearsal = await createRehearsal(
          rehearsalDataWithoutSongs,
        );

        if (createdRehearsal && createdRehearsal.id) {
          setSavedRehearsalId(createdRehearsal.id);
          setIsRehearsalSaved(true);

          if (formData.rehearsalSongs && formData.rehearsalSongs.length > 0) {
            await addSongsToRehearsal(
              createdRehearsal.id,
              formData.rehearsalSongs,
            );
          }

          toast.success('Répétition créée avec succès');
          onSuccess?.();
        } else {
          toast.error('Erreur lors de la création de la répétition');
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Une erreur est survenue lors de la sauvegarde de la répétition';

      // Show error toast
      toast.error(errorMessage);

      // Set a general error message
      setValidationErrors({
        general: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const getSelectedRehearsalTypeName = (type: RehearsalType) => {
    const typeMap: Record<string, string> = {
      'General Practice': 'Pratique Générale',
      'Performance Preparation': 'Préparation de Performance',
      'Song Learning': 'Apprentissage de Chansons',
      'Sectional Practice': 'Répétition par Section',
      'Full Ensemble': 'Ensemble Complet',
      'Dress Rehearsal': 'Répétition Générale',
      Other: 'Autre',
    };
    return typeMap[type] || type;
  };

  const mapEnglishToEnum = (englishValue: string): RehearsalType | null => {
    const englishToEnumMap: Record<string, RehearsalType> = {
      'General Practice': RehearsalType.GENERAL_PRACTICE,
      'Performance Preparation': RehearsalType.PERFORMANCE_PREPARATION,
      'Song Learning': RehearsalType.SONG_LEARNING,
      'Sectional Practice': RehearsalType.SECTIONAL_PRACTICE,
      'Full Ensemble': RehearsalType.FULL_ENSEMBLE,
      'Dress Rehearsal': RehearsalType.DRESS_REHEARSAL,
      Other: RehearsalType.OTHER,
    };
    return englishToEnumMap[englishValue] || null;
  };

  if (!user || !user.role) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="p-6">
            <p className="text-red-600">Authentification requise</p>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-xl sm:h-[98vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-400 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            {(() => {
              if (isEditing) return 'Modifier la répétition';
              if (isTemplateMode)
                return 'Créer une répétition à partir du modèle';
              return 'Créer une nouvelle répétition';
            })()}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-md bg-red-500 px-3 py-2 text-gray-400 transition-colors hover:text-gray-600 sm:px-4 sm:py-2"
          >
            <FaTimes className="text-base text-white sm:text-lg" />
          </button>
        </div>

        <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {validationErrors.general && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 sm:p-4">
                <p className="text-xs text-red-600 sm:text-sm">
                  {validationErrors.general}
                </p>
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-400 bg-white p-4 sm:gap-4 sm:p-6 lg:grid-cols-3">
              <h4 className="sm:text-md col-span-1 mb-2 text-sm font-medium text-gray-900 sm:mb-4 lg:col-span-3">
                Informations générales
              </h4>

              <div className="mb-2 sm:mb-4 lg:col-span-3">
                <label
                  htmlFor="title"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Titre *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
                    validationErrors.title
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Entrez le titre de la répétition"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-xs text-red-600 sm:text-sm">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
                    validationErrors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.date && (
                  <p className="mt-1 text-xs text-red-600 sm:text-sm">
                    {validationErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Durée (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  step="15"
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
                    validationErrors.duration
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {validationErrors.duration && (
                  <p className="mt-1 text-xs text-red-600 sm:text-sm">
                    {validationErrors.duration}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Type de répétition *
                </label>
                <div className="relative" ref={typeDropdownRef}>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={getSelectedRehearsalTypeName(formData.type)}
                    onChange={(e) => {
                      const searchTerm = e.target.value;
                      const foundType = getRehearsalTypeOptions().find(
                        (option) =>
                          option.label
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      );
                      if (foundType) {
                        const enumValue = mapEnglishToEnum(foundType.value);
                        if (enumValue) {
                          setFormData((prev) => ({ ...prev, type: enumValue }));
                        }
                      }
                    }}
                    placeholder="Tapez pour rechercher un type..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                    onFocus={() => setShowTypeDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowTypeDropdown(false), 200)
                    }
                  />
                  {showTypeDropdown && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                      {getRehearsalTypeOptions().map((option) => (
                        <div
                          key={option.value}
                          className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const enumValue = mapEnglishToEnum(option.value);
                            if (enumValue) {
                              setFormData((prev) => ({
                                ...prev,
                                type: enumValue,
                              }));
                            }
                            setShowTypeDropdown(false);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Lieu *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
                    validationErrors.location
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Entrez le lieu de la répétition"
                />
                {validationErrors.location && (
                  <p className="mt-1 text-xs text-red-600 sm:text-sm">
                    {validationErrors.location}
                  </p>
                )}
              </div>

              {/* Performance Selector - Only show if no performanceId is provided */}
              {!performanceId ? (
                <div className="lg:col-span-2">
                  <label
                    htmlFor="performanceId"
                    className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                  >
                    Performance associée *
                  </label>
                  {performancesLoading ? (
                    <div className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">
                        Chargement des performances...
                      </span>
                    </div>
                  ) : performancesError ? (
                    <div className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2">
                      <span className="text-red-600">
                        Erreur lors du chargement: {performancesError}
                      </span>
                    </div>
                  ) : (
                    <Select
                      id="performanceId"
                      name="performanceId"
                      value={
                        performances.find(
                          (p) => p.id === formData.performanceId,
                        )
                          ? {
                              value: formData.performanceId,
                              label: `${performances.find((p) => p.id === formData.performanceId)?.type} - ${new Date(performances.find((p) => p.id === formData.performanceId)?.date || '').toLocaleDateString('fr-FR')} (${performances.find((p) => p.id === formData.performanceId)?.location || 'Lieu non spécifié'})`,
                            }
                          : null
                      }
                      onChange={(selectedOption) => {
                        const perfId = selectedOption
                          ? selectedOption.value
                          : 0;
                        setFormData((prev) => ({
                          ...prev,
                          performanceId: perfId,
                        }));

                        if (validationErrors.performanceId) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            performanceId: '',
                          }));
                        }
                      }}
                      options={(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const futurePerformances = performances.filter(
                          (performance) => {
                            const performanceDate = new Date(performance.date);
                            performanceDate.setHours(0, 0, 0, 0);
                            return performanceDate >= today;
                          },
                        );

                        const sortedPerformances = futurePerformances.sort(
                          (a, b) => {
                            const dateA = new Date(a.date);
                            const dateB = new Date(b.date);
                            return dateA.getTime() - dateB.getTime();
                          },
                        );

                        const options = sortedPerformances.map(
                          (performance) => ({
                            value: performance.id,
                            label: `${performance.type} - ${new Date(performance.date).toLocaleDateString('fr-FR')} (${performance.location || 'Lieu non spécifié'})`,
                          }),
                        );
                        return options;
                      })()}
                      placeholder="Sélectionnez une performance..."
                      isSearchable
                      isClearable
                      className={`w-full ${validationErrors.performanceId ? 'border-red-300' : ''}`}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: validationErrors.performanceId
                            ? '#fca5a5'
                            : state.isFocused
                              ? '#3b82f6'
                              : '#d1d5db',
                          boxShadow: state.isFocused
                            ? '0 0 0 2px rgba(59, 130, 246, 0.5)'
                            : 'none',
                          '&:hover': {
                            borderColor: validationErrors.performanceId
                              ? '#fca5a5'
                              : '#9ca3af',
                          },
                        }),
                      }}
                    />
                  )}
                  {validationErrors.performanceId && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.performanceId}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Performance associée
                  </label>
                </div>
              )}
              <div>
                <label
                  htmlFor="rehearsalLeadId"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                >
                  Conducteur *
                </label>
                <select
                  id="rehearsalLeadId"
                  name="rehearsalLeadId"
                  value={formData.rehearsalLeadId}
                  onChange={(e) => {
                    const leaderId = parseInt(e.target.value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      rehearsalLeadId: leaderId,
                    }));
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${
                    validationErrors.rehearsalLeadId
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Sélectionnez un conducteur ...</option>
                  {leaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.lastName} {leader.firstName}
                    </option>
                  ))}
                </select>
                {validationErrors.rehearsalLeadId && (
                  <p className="mt-1 text-xs text-red-600 sm:text-sm">
                    {validationErrors.rehearsalLeadId}
                  </p>
                )}
              </div>

              {/* Template Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTemplate"
                  name="isTemplate"
                  checked={formData.isTemplate}
                  onChange={handleInputChange}
                  className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isTemplate"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Sauvegarder comme modèle réutilisable
                </label>
              </div>
            </div>

            {/* Planning Section */}
            <div className="rounded-lg border border-gray-400 bg-white p-3 sm:p-4">
              <h4 className="sm:text-md mb-3 text-sm font-medium text-gray-900 sm:mb-4">
                Planification
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {/* Objectives */}
                <div>
                  <label
                    htmlFor="objectives"
                    className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                  >
                    Objectifs
                  </label>
                  <textarea
                    id="objectives"
                    name="objectives"
                    value={formData.objectives || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                    placeholder="Décrivez les objectifs de cette répétition..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                    placeholder="Ajoutez des notes supplémentaires..."
                  />
                </div>
              </div>
            </div>

            {/* Song Management Section */}
            <div className="rounded-lg border border-gray-400 bg-white p-3 sm:p-6">
              <h4 className="sm:text-md mb-3 text-sm font-medium text-gray-900 sm:mb-4">
                Gestion des chansons
              </h4>

              {validationErrors.songs && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 sm:mb-4 sm:p-3">
                  <p className="text-xs text-red-600 sm:text-sm">
                    {validationErrors.songs}
                  </p>
                </div>
              )}

              <RehearsalSongManager
                songs={formData.rehearsalSongs || []}
                onSongsChange={handleSongsChange}
                performanceId={performanceId || 0} // Pass performanceId or 0
                rehearsalData={formData}
                onRehearsalSave={async (data) => {
                  if (isEditing && rehearsal?.id) {
                    // For editing, update the existing rehearsal
                    const success = await updateRehearsal(rehearsal.id, data);
                    if (success) {
                      setIsRehearsalSaved(true);
                      setSavedRehearsalId(rehearsal.id);
                      return { id: rehearsal.id, ...data };
                    }
                    throw new Error('Failed to update rehearsal');
                  } else {
                    const rehearsalDataWithoutSongs = {
                      ...data,
                      rehearsalSongs: undefined,
                    };
                    const savedRehearsal = await createRehearsal(
                      rehearsalDataWithoutSongs,
                    );
                    if (savedRehearsal && savedRehearsal.id) {
                      setIsRehearsalSaved(true);
                      setSavedRehearsalId(savedRehearsal.id);
                    }
                    return savedRehearsal;
                  }
                }}
                isRehearsalSaved={isRehearsalSaved || isEditing}
                rehearsalId={savedRehearsalId || rehearsal?.id}
              />
            </div>

            <div className="sticky bottom-0 flex flex-col justify-end gap-2 border-t border-gray-400 bg-white pt-3 sm:flex-row sm:gap-3 sm:pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                {isEditing ? 'Confirmer la modification' : "Confirmer l'ajout"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RehearsalForm;
