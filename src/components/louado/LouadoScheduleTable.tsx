import React, { useMemo } from 'react';
import {
  FaDownload,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';

import type { LouadoShift } from '@/lib/louado/types';

interface LouadoScheduleTableProps {
  shifts: LouadoShift[];
  isLoading?: boolean;
  error?: string | null;
  canManage?: boolean;
  disableManageActions?: boolean;
  onCreate?: () => void;
  onEdit?: (shift: LouadoShift) => void;
  onDelete?: (shift: LouadoShift) => void;
  onExport?: () => void;
}

const monthRangeLabel = (shifts: LouadoShift[]) => {
  if (!shifts.length) {
    return 'Calendrier Louado';
  }

  const sorted = [...shifts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const firstShift = sorted[0];
  const lastShift = sorted[sorted.length - 1];
  if (!firstShift || !lastShift) {
    return 'Calendrier Louado';
  }

  const first = new Date(firstShift.date);
  const last = new Date(lastShift.date);

  const formatMonth = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

  const firstLabel = formatMonth(first);
  const lastLabel = formatMonth(last);

  return firstLabel === lastLabel
    ? `Calendrier Louado ${firstLabel}`
    : `Calendrier Louado ${firstLabel} - ${lastLabel}`;
};

const formatDateForCell = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
};

const renderName = (shift?: LouadoShift['louange']) => {
  if (!shift) return '—';
  const names = [shift.firstName, shift.lastName]
    .filter(Boolean)
    .map((value) => value?.toUpperCase());
  return names.length ? names.join(' ') : '—';
};

export const LouadoScheduleTable: React.FC<LouadoScheduleTableProps> = ({
  shifts,
  isLoading = false,
  error = null,
  canManage = false,
  disableManageActions = false,
  onCreate,
  onEdit,
  onDelete,
  onExport,
}) => {
  const title = useMemo(() => monthRangeLabel(shifts), [shifts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase text-emerald-800">
            {title}
          </h1>
          <p className="text-sm text-emerald-700">
            Rota hebdomadaire des responsables Louange & Adoration
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              <FaDownload className="hidden sm:inline" />
              Export PDF
            </button>
          )}
          {canManage && (
            <button
              onClick={onCreate}
              disabled={disableManageActions}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                disableManageActions
                  ? 'cursor-not-allowed bg-emerald-300 text-emerald-800 opacity-70'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <FaPlus />
              Nouveau shift
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FaExclamationTriangle className="text-lg" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-emerald-200 shadow-sm">
        <table className="min-w-full divide-y divide-emerald-200">
          <thead>
            <tr className="bg-emerald-700 text-xs uppercase tracking-widest text-emerald-50 md:text-sm">
              <th className="px-4 py-3 text-center">Date</th>
              <th className="px-4 py-3 text-center">Louange</th>
              <th className="px-4 py-3 text-center">Adoration</th>
              <th className="px-4 py-3 text-left">Obs</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-emerald-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-4 py-8 text-center text-sm text-emerald-700"
                >
                  Chargement du calendrier Louado...
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-4 py-10 text-center text-sm text-emerald-700"
                >
                  Aucun shift Louado enregistré pour la période sélectionnée.
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-emerald-100 text-sm text-emerald-900 transition-colors even:bg-emerald-100/60 hover:bg-emerald-100"
                >
                  <td className="px-4 py-3 text-center font-semibold uppercase tracking-wide">
                    {formatDateForCell(shift.date)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {renderName(shift.louange)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {renderName(shift.adoration)}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-800">
                    {shift.notes || ''}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2 text-emerald-700">
                        <button
                          className={`rounded-md border border-transparent p-2 transition-colors ${
                            disableManageActions
                              ? 'cursor-not-allowed text-emerald-400'
                              : 'hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                          onClick={() => {
                            if (!disableManageActions) {
                              onEdit?.(shift);
                            }
                          }}
                          disabled={disableManageActions}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`rounded-md border border-transparent p-2 transition-colors ${
                            disableManageActions
                              ? 'cursor-not-allowed text-red-300'
                              : 'hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                          }`}
                          onClick={() => {
                            if (!disableManageActions) {
                              onDelete?.(shift);
                            }
                          }}
                          disabled={disableManageActions}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LouadoScheduleTable;
