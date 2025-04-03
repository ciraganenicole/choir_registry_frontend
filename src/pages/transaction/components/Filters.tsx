import { Currency, TransactionType } from '../types';

interface FiltersProps {
  currentFilters: {
    type?: string;
    currency?: string;
    period?: string;
    category?: string;
  };
  onFilterChange: (filters: any) => void;
  onExport: () => void;
  categories: string[];
}

export const Filters = ({
  currentFilters,
  onFilterChange,
  onExport,
  categories,
}: FiltersProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Type de Transaction
        </label>
        <select
          value={currentFilters.type || ''}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, type: e.target.value })
          }
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tous</option>
          <option value={TransactionType.INCOME}>Revenu</option>
          <option value={TransactionType.EXPENSE}>Dépense</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Devise
        </label>
        <select
          value={currentFilters.currency || ''}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, currency: e.target.value })
          }
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Toutes</option>
          <option value={Currency.USD}>USD</option>
          <option value={Currency.FC}>FC</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Période
        </label>
        <select
          value={currentFilters.period || ''}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, period: e.target.value })
          }
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Toutes</option>
          <option value="today">Aujourd&apos;hui</option>
          <option value="week">Cette Semaine</option>
          <option value="month">Ce Mois</option>
          <option value="year">Cette Année</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Catégorie
        </label>
        <select
          value={currentFilters.category || ''}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, category: e.target.value })
          }
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Toutes</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={onExport}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Exporter
        </button>
      </div>
    </div>
  );
};
