import React, { useState } from 'react';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMusic,
  FaPlus,
  FaStickyNote,
  FaTimes,
  FaUsers as FaAudience,
} from 'react-icons/fa';

import { getPerformanceTypeLabel } from '@/lib/performance/logic';
import type {
  CreatePerformanceDto,
  Performance,
  UpdatePerformanceDto,
} from '@/lib/performance/types';
import { PerformanceType } from '@/lib/performance/types';
import { getActualShiftStatus, useCurrentShift } from '@/lib/shift/logic';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

interface PerformanceFormProps {
  performance?: Performance;
  onSubmit: (
    data: CreatePerformanceDto | UpdatePerformanceDto,
  ) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PerformanceForm: React.FC<PerformanceFormProps> = ({
  performance,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { user } = useAuth();

  // Check if user can manage performances (SUPER_ADMIN and LEAD category users only)
  const canManagePerformances =
    user?.categories?.includes(UserCategory.LEAD) ||
    user?.role === UserRole.SUPER_ADMIN;
  const {
    currentShift,
    isLoading: shiftLoading,
    validationStatus,
  } = useCurrentShift();

  const [formData, setFormData] = useState<CreatePerformanceDto>({
    date: '',
    type: PerformanceType.SUNDAY_SERVICE,
    shiftLeadId: currentShift?.leaderId || undefined, // Optional - can be assigned later
    location: '',
    expectedAudience: 0,
    notes: '',
  });

  // Update shiftLeadId when current shift changes
  React.useEffect(() => {
    if (currentShift?.leaderId) {
      setFormData((prev) => ({
        ...prev,
        shiftLeadId: currentShift.leaderId,
      }));
    }
  }, [currentShift?.leaderId]);

  // Initialize form data when editing an existing performance
  React.useEffect(() => {
    if (performance) {
      setFormData({
        date: (() => {
          if (performance.date instanceof Date) {
            return performance.date.toISOString().split('T')[0];
          }
          if (typeof performance.date === 'string') {
            return performance.date;
          }
          return '';
        })() as string,
        type: performance.type || PerformanceType.SUNDAY_SERVICE,
        shiftLeadId:
          performance.shiftLeadId || currentShift?.leaderId || undefined,
        location: performance.location || '',
        expectedAudience: performance.expectedAudience || 0,
        notes: performance.notes || '',
      });
    }
  }, [performance, currentShift?.leaderId]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shiftValidationWarning, setShiftValidationWarning] = useState<
    string | null
  >(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    setShiftValidationWarning(null);

    // Basic validation for required fields
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.type) {
      newErrors.type = 'Le type est requis';
    }

    // Shift validation removed - performances can be created without active shifts
    // Shift validation is now optional - performances can be created without assignment
    if (currentShift) {
      if (!currentShift.leaderId) {
        newErrors.general = 'Aucun chef de service assigné au shift';
        setErrors(newErrors);
        return false;
      }

      const actualStatus = getActualShiftStatus(currentShift);
      if (actualStatus === 'Completed' || actualStatus === 'Cancelled') {
        newErrors.general =
          'Ce shift est terminé ou annulé, impossible de créer une performance';
        setErrors(newErrors);
        return false;
      }
    }

    // Optional field validations
    if (formData.location && formData.location.trim() === '') {
      newErrors.location =
        "L'emplacement ne peut pas être vide s'il est fourni";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    // Clean up optional fields - remove empty strings and 0 values
    const cleanedData: CreatePerformanceDto = {
      ...formData,
      location: formData.location?.trim() || undefined,
      expectedAudience:
        formData.expectedAudience && formData.expectedAudience > 0
          ? formData.expectedAudience
          : undefined,
      notes: formData.notes?.trim() || undefined,
      shiftLeadId: currentShift?.leaderId || undefined, // Use current shift leader ID or undefined
    };

    await onSubmit(cleanedData);
  };

  const isEditing = !!performance;
  const title = isEditing
    ? 'Modifier la Performance'
    : 'Créer une Nouvelle Performance';
  const submitButtonText = isEditing ? 'Mettre à jour' : 'Créer';

  // Permission check - only admin or LEAD users can create/edit performances
  if (!canManagePerformances) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-[98%] overflow-y-auto rounded-lg bg-white p-6 shadow-xl md:w-[80%]">
          <div className="py-12 text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto size-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Accès Refusé
            </h3>
            <p className="mb-4 text-gray-600">
              Seuls les administrateurs et les utilisateurs avec le rôle LEAD
              peuvent créer ou modifier des performances.
            </p>
            <button
              onClick={onCancel}
              className="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-[98%] overflow-y-auto rounded-lg bg-white p-6 shadow-xl md:w-[80%]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <FaMusic className="text-2xl text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Shift Validation Warning */}
          {shiftValidationWarning && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="size-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Attention : Problème de Configuration des Shifts
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{shiftValidationWarning}</p>
                    <p className="mt-1">
                      <strong>Note :</strong> Vous pouvez continuer à créer la
                      performance, mais certains problèmes peuvent survenir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {validationStatus &&
            !validationStatus.isValid &&
            validationStatus.activeShifts.length > 1 && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="size-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Attention : Conflit de Shifts Détecté
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Il y a actuellement{' '}
                        {validationStatus.activeShifts.length} shifts actifs,
                        mais seulement un peut être actif à la fois. Le système
                        tentera de résoudre automatiquement ce conflit.
                      </p>
                      <p className="mt-1">
                        <strong>Shifts en conflit :</strong>
                      </p>
                      <ul className="mt-1 list-inside list-disc">
                        {validationStatus.activeShifts.map((shift, _index) => (
                          <li key={shift.id}>
                            {shift.name} ({shift.leader.firstName}{' '}
                            {shift.leader.lastName}) -
                            {new Date(shift.startDate).toLocaleDateString(
                              'fr-FR',
                            )}{' '}
                            à{' '}
                            {new Date(shift.endDate).toLocaleDateString(
                              'fr-FR',
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Current Shift Information */}
          {currentShift && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 text-blue-900">
                Conducteur actif :{' '}
                <span className="font-semibold text-green-600">
                  {currentShift.leader.firstName} {currentShift.leader.lastName}
                </span>
              </h3>
              <div className="text-sm text-blue-700">
                <p>
                  <strong>Période :</strong>{' '}
                  {new Date(currentShift.startDate).toLocaleDateString('fr-FR')}{' '}
                  - {new Date(currentShift.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <FaCalendarAlt className="mr-2 inline text-gray-400" />
                Date de la Performance *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full rounded-md border px-3 py-2 focus:border-orange-500 focus:outline-none ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <FaMusic className="mr-2 inline text-gray-400" />
                Type de Performance *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              >
                <option value={PerformanceType.SUNDAY_SERVICE}>
                  {getPerformanceTypeLabel(PerformanceType.SUNDAY_SERVICE)}
                </option>
                <option value={PerformanceType.CONCERT}>
                  {getPerformanceTypeLabel(PerformanceType.CONCERT)}
                </option>
                <option value={PerformanceType.SPECIAL_EVENT}>
                  {getPerformanceTypeLabel(PerformanceType.SPECIAL_EVENT)}
                </option>
                <option value={PerformanceType.WEDDING}>
                  {getPerformanceTypeLabel(PerformanceType.WEDDING)}
                </option>
                <option value={PerformanceType.FUNERAL}>
                  {getPerformanceTypeLabel(PerformanceType.FUNERAL)}
                </option>
                <option value={PerformanceType.OTHER}>
                  {getPerformanceTypeLabel(PerformanceType.OTHER)}
                </option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <FaMapMarkerAlt className="mr-2 inline text-gray-400" />
                Emplacement (optionnel)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ex: Salle principale, Auditorium, etc."
                className={`w-full rounded-md border px-3 py-2 focus:border-orange-500 focus:outline-none ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Expected Audience */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <FaAudience className="mr-2 inline text-gray-400" />
                Public Attendu (optionnel)
              </label>
              <input
                type="number"
                value={formData.expectedAudience}
                onChange={(e) =>
                  handleInputChange(
                    'expectedAudience',
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                placeholder="Nombre de personnes attendues"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <FaStickyNote className="mr-2 inline text-gray-400" />
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes additionnelles sur la performance..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                shiftLoading ||
                !currentShift?.leaderId ||
                getActualShiftStatus(currentShift) === 'Completed' ||
                getActualShiftStatus(currentShift) === 'Cancelled'
              }
              className="flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {(() => {
                if (loading) {
                  return (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {isEditing ? 'Mise à jour...' : 'Création...'}
                    </>
                  );
                }
                if (shiftLoading) {
                  return (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Chargement du shift...
                    </>
                  );
                }
                if (!currentShift?.leaderId) {
                  return 'Aucun conducteur assigné';
                }
                if (getActualShiftStatus(currentShift) === 'Completed') {
                  return 'Shift terminé';
                }
                if (getActualShiftStatus(currentShift) === 'Cancelled') {
                  return 'Shift annulé';
                }
                return (
                  <>
                    <FaPlus />
                    {submitButtonText}
                  </>
                );
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformanceForm;
