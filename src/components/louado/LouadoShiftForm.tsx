import React, { useEffect, useMemo, useState } from 'react';

import type { CreateLouadoShiftDto, LouadoShift } from '@/lib/louado/types';
import type { User } from '@/lib/user/type';
import { UserCategory } from '@/lib/user/type';

interface LouadoShiftFormProps {
  mode: 'create' | 'edit';
  initialShift?: LouadoShift | null;
  members: User[];
  onSubmit: (payload: CreateLouadoShiftDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const emptyForm: CreateLouadoShiftDto = {
  date: '',
  louangeId: 0,
  adorationId: 0,
  notes: '',
};

const sortMembersByName = (members: User[]) => {
  return [...members].sort((a, b) => {
    const aName = `${a.lastName || ''} ${a.firstName || ''}`.trim();
    const bName = `${b.lastName || ''} ${b.firstName || ''}`.trim();
    return aName.localeCompare(bName, 'fr');
  });
};

export const LouadoShiftForm: React.FC<LouadoShiftFormProps> = ({
  mode,
  initialShift,
  members,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CreateLouadoShiftDto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableMembers = useMemo(() => {
    const worshipperOnly = members.filter((member) => {
      const categories = member.categories ?? [];
      return categories.includes(UserCategory.WORSHIPPER);
    });
    return sortMembersByName(worshipperOnly);
  }, [members]);

  useEffect(() => {
    if (initialShift && mode === 'edit') {
      const parsedDate = new Date(initialShift.date);
      const normalizedDate = Number.isNaN(parsedDate.getTime())
        ? ''
        : parsedDate.toISOString().slice(0, 10);

      setFormData({
        date: normalizedDate,
        louangeId: initialShift.louangeId,
        adorationId: initialShift.adorationId,
        notes: initialShift.notes || '',
      });
    } else {
      setFormData((prev) => ({
        ...emptyForm,
        date: prev.date || '',
      }));
    }
  }, [initialShift, mode]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'louangeId' || name === 'adorationId' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.date) {
      nextErrors.date = 'La date est requise.';
    }
    if (!formData.louangeId) {
      nextErrors.louangeId = 'Sélectionnez un leader de louange.';
    }
    if (!formData.adorationId) {
      nextErrors.adorationId = "Sélectionnez un leader pour l'adoration.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    await onSubmit({
      ...formData,
      notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {availableMembers.length === 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Aucun membre Louange/Adoration n’est disponible. Vérifiez que les
          comptes concernés possèdent bien la catégorie{' '}
          <strong>WORSHIPPER</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Date
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.date && (
            <span className="text-xs text-red-600">{errors.date}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Responsable Louange
          <select
            name="louangeId"
            value={formData.louangeId || ''}
            onChange={handleChange}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>
              Sélectionnez un membre Louado
            </option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
              </option>
            ))}
          </select>
          {errors.louangeId && (
            <span className="text-xs text-red-600">{errors.louangeId}</span>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Responsable Adoration
          <select
            name="adorationId"
            value={formData.adorationId || ''}
            onChange={handleChange}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>
              Sélectionnez un membre Louado
            </option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
              </option>
            ))}
          </select>
          {errors.adorationId && (
            <span className="text-xs text-red-600">{errors.adorationId}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Observations
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes optionnelles (annonces, points d'attention, etc.)"
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? 'Enregistrement...'
            : mode === 'create'
              ? 'Créer le shift'
              : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
};

export default LouadoShiftForm;
