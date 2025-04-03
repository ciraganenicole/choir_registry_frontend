/* eslint-disable import/no-extraneous-dependencies */
import { Download, RefreshCw } from 'lucide-react';

import type { TransactionFilters } from './types';
import {
  ExpenseCategories,
  IncomeCategories,
  Subcategories,
  TransactionType,
} from './types';

// Helper function to translate categories to French
const translateCategoryToFrench = (category: string): string => {
  const translations: Record<string, string> = {
    // Income categories
    DAILY: 'Quotidien',
    SPECIAL: 'Spécial',
    DONATION: 'Donation',
    OTHER: 'Autre',
    // Expense categories
    CHARITY: 'Charité',
    MAINTENANCE: 'Maintenance',
    TRANSPORT: 'Transport',
    SPECIAL_ASSISTANCE: 'Assistance Spéciale',
    COMMUNICATION: 'Communication',
    RESTAURATION: 'Restauration',
    // Subcategories
    ILLNESS: 'Maladie',
    BIRTH: 'Naissance',
    MARRIAGE: 'Mariage',
    DEATH: 'Décès',
    BUY_DEVICES: "Achat d'Équipements",
    COMMITTEE: 'Comité',
    SORTIE: 'Sortie',
  };

  return translations[category] || category;
};

interface FiltersProps {
  onFilterChange: (filters: Partial<TransactionFilters>) => void;
  onExport: (format: 'csv' | 'pdf', exportAll?: boolean) => void;
  currentFilters: TransactionFilters;
}

const Filters = ({
  onFilterChange,
  onExport,
  currentFilters,
}: FiltersProps) => {
  const getCategories = () => {
    if (currentFilters.type === TransactionType.INCOME) {
      return Object.values(IncomeCategories);
    }
    if (currentFilters.type === TransactionType.EXPENSE) {
      return Object.values(ExpenseCategories);
    }
    // If no type is selected, return all categories
    return [
      ...Object.values(IncomeCategories),
      ...Object.values(ExpenseCategories),
    ];
  };

  const getSubcategories = () => {
    if (!currentFilters.category) return [];
    return Object.values(
      Subcategories[currentFilters.category as keyof typeof Subcategories] ||
        {},
    );
  };

  const categories = getCategories();
  const subcategories = getSubcategories();

  const handleTypeChange = (type: TransactionType | undefined) => {
    onFilterChange({
      type,
      category: undefined,
      subcategory: undefined,
    });
  };

  const handleCategoryChange = (category: string | undefined) => {
    // If the category is empty string, set it to undefined
    const categoryValue = category === '' ? undefined : category;
    onFilterChange({
      category: categoryValue,
      subcategory: undefined,
    });
  };

  const handleSubcategoryChange = (subcategory: string | undefined) => {
    // If the subcategory is empty string, set it to undefined
    const subcategoryValue = subcategory === '' ? undefined : subcategory;
    onFilterChange({
      subcategory: subcategoryValue,
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
      type: undefined,
      category: undefined,
      subcategory: undefined,
      startDate: undefined,
      endDate: undefined,
      search: undefined,
      contributorId: undefined,
      externalContributorName: undefined,
      externalContributorPhone: undefined,
      currency: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
  };

  return (
    <div className="my-8 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-row items-center space-x-4">
        {/* Income/Expense Toggle */}
        <div className="flex flex-row items-center rounded-md border-[1px] border-gray-500">
          <button
            onClick={() => handleTypeChange(undefined)}
            className={`px-6 py-1 ${
              currentFilters.type === undefined
                ? 'bg-gray-500/40 text-gray-900'
                : 'text-gray-500'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`px-6 py-1 ${
              currentFilters.type === TransactionType.INCOME
                ? 'bg-gray-500/40 text-gray-900'
                : 'text-gray-500'
            }`}
          >
            Revenu
          </button>
          <button
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`px-6 py-1 ${
              currentFilters.type === TransactionType.EXPENSE
                ? 'bg-gray-500/40 text-gray-900'
                : 'text-gray-500'
            }`}
          >
            Dépense
          </button>
        </div>

        {/* Reset Filters Button */}
        <button
          onClick={handleResetFilters}
          className="flex items-center space-x-1 rounded-md border-[1px] border-gray-500 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Right side filters */}
      <div className="flex flex-row items-center space-x-4">
        {/* Category Filter */}
        <select
          value={currentFilters.category || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="flex items-center rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm"
        >
          <option value="">Toutes Catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {translateCategoryToFrench(category)}
            </option>
          ))}
        </select>

        {/* Subcategory Filter */}
        {subcategories.length > 0 && (
          <select
            value={currentFilters.subcategory || ''}
            onChange={(e) => handleSubcategoryChange(e.target.value)}
            className="flex items-center rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm"
          >
            <option value="">Toutes Sous-catégories</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {translateCategoryToFrench(subcategory)}
              </option>
            ))}
          </select>
        )}

        {/* Date Range */}
        <div className="flex items-center space-x-2">
          <input
            type="date"
            placeholder="Date de début"
            className="rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm"
            value={currentFilters.startDate || ''}
            onChange={(e) =>
              onFilterChange({
                startDate: e.target.value || undefined,
              })
            }
          />
          <span className="text-gray-500">à</span>
          <input
            type="date"
            placeholder="Date de fin"
            className="rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm"
            value={currentFilters.endDate || ''}
            onChange={(e) =>
              onFilterChange({
                endDate: e.target.value || undefined,
              })
            }
          />
        </div>

        <button
          onClick={() => onExport('csv', !currentFilters.type)}
          className="flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          <Download className="mr-2 size-4" />
          Exporter
        </button>
      </div>
    </div>
  );
};

export default Filters;
