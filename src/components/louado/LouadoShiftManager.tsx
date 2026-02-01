import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFilter } from 'react-icons/fa';

import Dialog from '@/components/dialog';
import ConfirmationDialog from '@/components/dialog/ConfirmationDialog';
import {
  useCreateLouadoShift,
  useDeleteLouadoShift,
  useLouadoShifts,
  useUpdateLouadoShift,
} from '@/lib/louado/logic';
import { exportLouadoScheduleToPDF } from '@/lib/louado/pdf-export';
import type { LouadoShift, LouadoShiftFilters } from '@/lib/louado/types';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useUsers } from '@/lib/user/useUsers';
import { useAuth } from '@/providers/AuthProvider';

import { LouadoScheduleTable } from './LouadoScheduleTable';
import { LouadoShiftForm } from './LouadoShiftForm';

const defaultFilters: LouadoShiftFilters = {};

export const LouadoShiftManager: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<LouadoShiftFilters>(defaultFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedShift, setSelectedShift] = useState<LouadoShift | null>(null);
  const [deletingShift, setDeletingShift] = useState<LouadoShift | null>(null);

  const canManage =
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.LEAD ||
    user?.categories?.includes(UserCategory.WORSHIPPER);

  const { shifts, isLoading, error, refetch } = useLouadoShifts(filters, {
    auto: false,
  });
  const memberFilters = useMemo(
    () => ({
      limit: 100,
    }),
    [],
  );
  const { users: allUsers, isLoading: loadingMembers } =
    useUsers(memberFilters);

  const louadoMembers = useMemo(
    () =>
      allUsers.filter((member) =>
        member.categories?.includes(UserCategory.WORSHIPPER),
      ),
    [allUsers],
  );

  const { create, isLoading: isCreating } = useCreateLouadoShift();
  const { update, isLoading: isUpdating } = useUpdateLouadoShift();
  const { remove, isLoading: isDeleting } = useDeleteLouadoShift();

  const isSubmitting = isCreating || isUpdating;
  const louadoMemberIds = useMemo(() => {
    return new Set(louadoMembers.map((member) => member.id));
  }, [louadoMembers]);
  const manageActionsDisabled = useMemo(
    () => loadingMembers || louadoMembers.length === 0,
    [loadingMembers, louadoMembers.length],
  );
  const serializedFilters = useMemo(
    () =>
      JSON.stringify({
        ...filters,
      }),
    [filters],
  );

  useEffect(() => {
    refetch();
  }, [refetch, serializedFilters]);

  useEffect(() => {
    if (!loadingMembers) {
      if (allUsers.length === 0) {
        toast.error(
          'Impossible de charger les membres. Vérifiez la connexion ou actualisez la page.',
        );
      } else if (louadoMembers.length === 0) {
        toast.error(
          'Aucun worshipper trouvé. Assurez-vous que les membres possèdent la catégorie WORSHIPPER.',
        );
      }
    }
  }, [loadingMembers, allUsers, louadoMembers]);

  const sortedShifts = useMemo(
    () =>
      [...shifts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [shifts],
  );

  const openCreateForm = () => {
    if (manageActionsDisabled) {
      toast.error(
        'Chargement de la liste des worshippers… Veuillez patienter avant de créer un shift.',
      );
      return;
    }

    setFormMode('create');
    setSelectedShift(null);
    setIsFormOpen(true);
  };

  const openEditForm = (shift: LouadoShift) => {
    if (manageActionsDisabled) {
      toast.error(
        'Les responsables Louange/Adoration ne sont pas encore disponibles.',
      );
      return;
    }

    setFormMode('edit');
    setSelectedShift(shift);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedShift(null);
  };

  const normalizeDateInput = (value: string) => {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (value.includes('T')) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed.toISOString().split('T')[0];
    }

    return null;
  };

  const handleSubmit = async (payload: Parameters<typeof create>[0]) => {
    const normalizedDate = normalizeDateInput(payload.date);
    if (!normalizedDate) {
      toast.error(
        'La date est invalide. Utilisez le format YYYY-MM-DD (ex: 2025-06-08).',
      );
      return;
    }

    if (!louadoMemberIds.size) {
      toast.error(
        'Impossible de charger la liste des worshippers. Réessayez après le chargement.',
      );
      return;
    }

    if (!louadoMemberIds.has(payload.louangeId)) {
      toast.error(
        'Le responsable de louange sélectionné ne fait pas partie des worshippers.',
      );
      return;
    }

    if (!louadoMemberIds.has(payload.adorationId)) {
      toast.error(
        'Le responsable d’adoration sélectionné ne fait pas partie des worshippers.',
      );
      return;
    }

    const duplicateShift = sortedShifts.find((shift) => {
      const existingDate = shift.date.split('T')[0];
      return (
        existingDate === normalizedDate &&
        shift.id !== (selectedShift ? selectedShift.id : null)
      );
    });

    if (duplicateShift) {
      toast.error(
        `Un shift Louado est déjà planifié pour le ${normalizedDate}. Modifiez l’affectation existante ou choisissez une autre date.`,
      );
      return;
    }

    const sanitizedPayload = {
      ...payload,
      date: normalizedDate,
    };

    try {
      if (formMode === 'create') {
        const result = await create(sanitizedPayload);
        if (result) {
          toast.success('Shift Louado créé avec succès.');
          closeForm();
          refetch();
        }
      } else if (selectedShift?.id) {
        const result = await update(selectedShift.id, sanitizedPayload);
        if (result) {
          toast.success('Shift Louado mis à jour.');
          closeForm();
          refetch();
        }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur s'est produite lors de l'enregistrement.";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingShift) return;
    if (manageActionsDisabled) {
      toast.error(
        'Les responsables Louange/Adoration ne sont pas encore disponibles.',
      );
      return;
    }

    try {
      const success = await remove(deletingShift.id);
      if (success) {
        toast.success('Shift Louado supprimé.');
        setDeletingShift(null);
        refetch();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Suppression impossible.';
      toast.error(message);
    }
  };

  const handleFilterInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleExport = async () => {
    if (!sortedShifts.length) {
      toast.error('Aucune donnée à exporter.');
      return;
    }

    try {
      await exportLouadoScheduleToPDF(sortedShifts);
      toast.success('Export PDF généré.');
    } catch (err: any) {
      const message =
        err?.message || 'Impossible de générer le PDF du calendrier.';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-2 text-emerald-700">
            <FaFilter />
            <span className="text-sm font-semibold uppercase tracking-widest">
              Filtrer la période
            </span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex flex-col text-xs font-medium text-emerald-800">
              Date de début
              <input
                type="date"
                name="startDate"
                value={filters.startDate || ''}
                onChange={handleFilterInput}
                className="mt-1 rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-emerald-800">
              Date de fin
              <input
                type="date"
                name="endDate"
                value={filters.endDate || ''}
                onChange={handleFilterInput}
                className="mt-1 rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>
          </div>
        </div>
      </div>

      <LouadoScheduleTable
        shifts={sortedShifts}
        isLoading={isLoading}
        error={error}
        canManage={canManage}
        disableManageActions={manageActionsDisabled}
        onCreate={canManage ? openCreateForm : undefined}
        onEdit={canManage ? openEditForm : undefined}
        onDelete={canManage ? setDeletingShift : undefined}
        onExport={handleExport}
      />

      {isFormOpen && (
        <Dialog
          title={
            formMode === 'create'
              ? 'Créer un shift Louado'
              : 'Modifier un shift Louado'
          }
          width="w-full max-w-xl mx-4"
          onClose={closeForm}
        >
          <LouadoShiftForm
            mode={formMode}
            initialShift={selectedShift || undefined}
            members={louadoMembers}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}

      <ConfirmationDialog
        isOpen={Boolean(deletingShift)}
        title="Supprimer ce shift Louado ?"
        message={`Cette action supprimera définitivement le shift planifié pour le ${deletingShift ? new Date(deletingShift.date).toLocaleDateString('fr-FR') : ''}.`}
        onClose={() => setDeletingShift(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default LouadoShiftManager;
