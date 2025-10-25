import React, { useCallback, useMemo, useState } from 'react';

import { useYearlyPlanning } from '@/lib/performance/logic';
import type { CreatePerformanceDto } from '@/lib/performance/types';
import { PerformanceType } from '@/lib/performance/types';
import { UserCategory, UserRole } from '@/lib/user/type';
import { useUsers } from '@/lib/user/useUsers';

interface YearlyPlanningFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Function to calculate Easter date (Protestant calendar - Gregorian calendar)
const calculateEaster = (year: number): Date => {
  // Gregorian Easter calculation (used by Protestant churches)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = Math.floor((h + l - 7 * m + 114) / 31);
  const p = (h + l - 7 * m + 114) % 31;

  return new Date(year, n - 1, p + 1);
};

// Function to calculate Advent Sunday (4th Sunday before Christmas)
const calculateAdvent = (year: number): Date => {
  const christmas = new Date(year, 11, 25); // December 25
  const advent = new Date(christmas);
  advent.setDate(christmas.getDate() - (christmas.getDay() + 21)); // 4th Sunday before Christmas
  return advent;
};

// Function to calculate Ash Wednesday (46 days before Easter)
const calculateAshWednesday = (year: number): Date => {
  const easter = calculateEaster(year);
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  return ashWednesday;
};

const YearlyPlanningForm: React.FC<YearlyPlanningFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const { bulkCreatePerformances, loading, error } = useYearlyPlanning();
  const [creationProgress, setCreationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const { users } = useUsers();

  const [year, setYear] = useState(new Date().getFullYear());
  const [performances, setPerformances] = useState<CreatePerformanceDto[]>([]);
  const [selectedType] = useState<PerformanceType>(
    PerformanceType.SUNDAY_SERVICE,
  );
  const [selectedShiftLeadId] = useState<number | undefined>(undefined);

  // Get available shift leads (users with LEAD category or admin roles)
  const availableShiftLeads = useMemo(() => {
    return users.filter(
      (user) =>
        user.categories?.includes(UserCategory.LEAD) ||
        user.role === UserRole.SUPER_ADMIN,
    );
  }, [users]);

  // Generate default performances for the year
  const generateYearlyPerformances = useCallback(() => {
    const yearlyPerformances: CreatePerformanceDto[] = [];

    // Generate Sunday Services (every Sunday)
    for (let month = 0; month < 12; month += 1) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      for (let day = firstDay.getDate(); day <= lastDay.getDate(); day += 1) {
        const date = new Date(year, month, day);
        if (date.getDay() === 0) {
          // Sunday
          yearlyPerformances.push({
            date: date.toISOString().split('T')[0] || '',
            type: PerformanceType.SUNDAY_SERVICE,
            shiftLeadId: selectedShiftLeadId,
            location: 'Église Salem',
            expectedAudience: 150,
            notes: `Service dominical - ${date.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}`,
          });
        }
      }
    }

    const easterDate = calculateEaster(year);
    const goodFriday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 2); // Good Friday is 2 days before Easter

    const pentecost = new Date(easterDate);
    pentecost.setDate(easterDate.getDate() + 49); // Pentecost is 49 days after Easter

    const advent = calculateAdvent(year);
    const ashWednesday = calculateAshWednesday(year);

    const specialEvents = [
      {
        date: new Date(year, 0, 1),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Nouvel An',
      },

      {
        date: ashWednesday,
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Mercredi des Cendres',
      },

      {
        date: goodFriday,
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Vendredi Saint',
      },

      { date: easterDate, type: PerformanceType.SPECIAL_EVENT, name: 'Pâques' },

      {
        date: new Date(year, 4, 1),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Fête du Travail',
      },

      {
        date: new Date(year, 4, 8),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Victoire 1945',
      },

      {
        date: pentecost,
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Pentecôte',
      },

      {
        date: new Date(year, 6, 14),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Fête Nationale',
      },

      {
        date: new Date(year, 9, 31),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Fête de la Réformation',
      },

      {
        date: new Date(year, 10, 11),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Armistice',
      },

      {
        date: advent,
        type: PerformanceType.SPECIAL_EVENT,
        name: "Premier Dimanche de l'Avent",
      },

      {
        date: new Date(year, 11, 24),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Veille de Noël',
      },

      {
        date: new Date(year, 11, 25),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Noël',
      },

      {
        date: new Date(year, 11, 31),
        type: PerformanceType.SPECIAL_EVENT,
        name: 'Saint-Sylvestre',
      },
    ];

    specialEvents.forEach((event) => {
      yearlyPerformances.push({
        date: event.date.toISOString().split('T')[0] || '',
        type: event.type,
        shiftLeadId: selectedShiftLeadId,
        location: 'Église Salem',
        expectedAudience: 200,
        notes: `${event.name} - ${event.date.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}`,
      });
    });

    setPerformances(yearlyPerformances);
  }, [year, selectedShiftLeadId]);

  const handleSubmit = async () => {
    if (performances.length === 0) {
      return;
    }

    if (performances.length > 100) {
      return;
    }

    if (performances.length > 10) {
      setCreationProgress({ current: 0, total: performances.length });
    }

    try {
      const createdPerformances = await bulkCreatePerformances(performances);
      if (createdPerformances) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error creating performances:', err);
    } finally {
      setCreationProgress(null);
    }
  };

  const addCustomPerformance = () => {
    const newPerformance: CreatePerformanceDto = {
      date: '',
      type: selectedType,
      shiftLeadId: selectedShiftLeadId,
      location: '',
      expectedAudience: 0,
      notes: '',
    };
    setPerformances((prev) => [...prev, newPerformance]);
  };

  const updatePerformance = (
    index: number,
    field: keyof CreatePerformanceDto,
    value: any,
  ) => {
    setPerformances((prev) =>
      prev.map((perf, i) => (i === index ? { ...perf, [field]: value } : perf)),
    );
  };

  const removePerformance = (index: number) => {
    setPerformances((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Planification Annuelle des Performances
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="mb-4 flex items-center gap-10">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Configuration de la Planification
              </h3>
              <button
                type="button"
                onClick={addCustomPerformance}
                className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                Ajouter Performance Personnalisée
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Année
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2024"
                  max="2030"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={generateYearlyPerformances}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Générer Performances Annuelles
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            {performances.length > 0 && (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {performances.map((performance, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Performance #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePerformance(index)}
                        className="text-red-600 transition-colors hover:text-red-800"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Date
                        </label>
                        <input
                          type="date"
                          value={performance.date}
                          onChange={(e) =>
                            updatePerformance(index, 'date', e.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={performance.type}
                          onChange={(e) =>
                            updatePerformance(
                              index,
                              'type',
                              e.target.value as PerformanceType,
                            )
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.values(PerformanceType).map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Conducteur
                        </label>
                        <select
                          value={performance.shiftLeadId || ''}
                          onChange={(e) =>
                            updatePerformance(
                              index,
                              'shiftLeadId',
                              e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            )
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Non assigné</option>
                          {availableShiftLeads.map((lead) => (
                            <option key={lead.id} value={lead.id}>
                              {lead.firstName} {lead.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Audience Attendue
                        </label>
                        <input
                          type="number"
                          value={performance.expectedAudience || ''}
                          onChange={(e) =>
                            updatePerformance(
                              index,
                              'expectedAudience',
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={performance.notes || ''}
                        onChange={(e) =>
                          updatePerformance(index, 'notes', e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Notes optionnelles..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {creationProgress && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  Création en cours... {creationProgress.current} /{' '}
                  {creationProgress.total}
                </p>
                <span className="text-sm text-blue-600">
                  {Math.round(
                    (creationProgress.current / creationProgress.total) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(creationProgress.current / creationProgress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || performances.length === 0}
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? `Création en cours... (${performances.length} performances)`
              : `Créer ${performances.length} Performances`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YearlyPlanningForm;
