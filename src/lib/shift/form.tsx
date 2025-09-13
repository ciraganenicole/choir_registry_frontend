import React, { useEffect, useState } from 'react';

import type { User } from '@/lib/user/type';
import { UserCategory } from '@/lib/user/type';
import { FetchUsers } from '@/lib/user/user_actions';
import { useAuth } from '@/providers/AuthProvider';

import type { CreateLeadershipShiftDto, LeadershipShift } from './logic';
import { ShiftStatus, useCreateShift, useUpdateShift } from './logic';

interface ShiftFormProps {
  shift?: LeadershipShift | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  shift,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const {
    createShift,
    isLoading: isCreating,
    error: createError,
  } = useCreateShift();
  const {
    updateShift,
    isLoading: isUpdating,
    error: updateError,
  } = useUpdateShift();

  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;
  const isEditing = !!shift;

  const [formData, setFormData] = useState<CreateLeadershipShiftDto>({
    name: '',
    leaderId: 0,
    startDate: '',
    endDate: '',
    status: ShiftStatus.UPCOMING,
    eventsScheduled: 0,
    eventsCompleted: 0,
    notes: '',
  });

  const [leaders, setLeaders] = useState<User[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Initialize form data when editing
  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name || '',
        leaderId: shift.leader?.id || 0,
        startDate: shift.startDate || '',
        endDate: shift.endDate || '',
        status: shift.status || ShiftStatus.UPCOMING,
        eventsScheduled: shift.eventsScheduled || 0,
        eventsCompleted: shift.eventsCompleted || 0,
        notes: shift.notes || '',
      });
    }
  }, [shift]);

  // Fetch leaders (users with LEAD category)
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const result = await FetchUsers({
          category: UserCategory.LEAD,
          page: 1,
          limit: 1000, // Get all leads
        });
        setLeaders(result.data || []);
      } catch (fetchError) {
        // Silently ignore leader fetch errors
        console.warn('Failed to fetch leaders:', fetchError);
      }
    };

    fetchLeaders();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Shift name is required';
    }

    if (!formData.leaderId) {
      errors.leaderId = 'Please select a leader';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (startDate >= endDate) {
        errors.endDate = 'End date must be after start date';
      }
    }

    if ((formData.eventsScheduled || 0) < 0) {
      errors.eventsScheduled = 'Events scheduled cannot be negative';
    }

    if ((formData.eventsCompleted || 0) < 0) {
      errors.eventsCompleted = 'Events completed cannot be negative';
    }

    if ((formData.eventsCompleted || 0) > (formData.eventsScheduled || 0)) {
      errors.eventsCompleted =
        'Events completed cannot exceed events scheduled';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'leaderId' ||
        name === 'eventsScheduled' ||
        name === 'eventsCompleted'
          ? parseInt(value, 10) || 0
          : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditing) {
      const success = await updateShift(shift!.id, formData);
      if (success) {
        onSuccess?.();
      }
    } else {
      const success = await createShift(formData);
      if (success) {
        onSuccess?.();
      }
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  if (!user || !user.role) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <p className="text-red-600">Authentication required</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-6 text-lg font-medium text-gray-900">
        {isEditing ? "Modifier l'horaire" : 'Créer un nouvel horaire'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shift Name */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nom *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter shift name"
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        {/* Leader Selection */}
        <div>
          <label
            htmlFor="leaderId"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Conducteur *
          </label>
          <select
            id="leaderId"
            name="leaderId"
            value={formData.leaderId}
            onChange={handleInputChange}
            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.leaderId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value={0}>Selectionner conducteur</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.lastName} {leader.firstName}
              </option>
            ))}
          </select>
          {validationErrors.leaderId && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.leaderId}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              De *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.startDate
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
            />
            {validationErrors.startDate && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.startDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Au *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={ShiftStatus.UPCOMING}>À venir</option>
            <option value={ShiftStatus.ACTIVE}>Actif</option>
            <option value={ShiftStatus.COMPLETED}>Terminé</option>
            <option value={ShiftStatus.CANCELLED}>Annulé</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(() => {
              if (isLoading) {
                return (
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
                    {isEditing ? 'Mise à jour...' : 'Création...'}
                  </div>
                );
              }
              return isEditing ? 'Mettre à jour' : 'Créer';
            })()}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftForm;
