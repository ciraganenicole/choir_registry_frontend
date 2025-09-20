/* eslint-disable import/no-extraneous-dependencies */
import { format, parseISO, startOfDay } from 'date-fns';
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
  onExport: (
    format: 'csv' | 'pdf',
    exportAll?: boolean,
    conversionRate?: number,
  ) => void;
  conversionRate: number;
  setConversionRate: React.Dispatch<React.SetStateAction<number>>;
  currentFilters: TransactionFilters;
}

const Filters = ({
  onFilterChange,
  onExport,
  currentFilters,
  conversionRate,
  setConversionRate,
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

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      // Use startOfDay to ensure we're working with the local date
      const date = startOfDay(parseISO(dateString));
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return '';
    }
  };

  const handleDateChange = (date: string | undefined, isStartDate: boolean) => {
    if (!date) {
      onFilterChange({
        [isStartDate ? 'startDate' : 'endDate']: undefined,
      });
      return;
    }

    // Create a date object in local timezone
    const localDate = new Date(date);
    // Format it to ensure we keep the local date
    const formattedDate = format(localDate, 'yyyy-MM-dd');

    onFilterChange({
      [isStartDate ? 'startDate' : 'endDate']: formattedDate,
    });
  };

  return (
    <div className="my-3 flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex flex-row items-center space-x-2 md:space-x-4">
          {/* Income/Expense Toggle */}
          <div className="flex flex-row items-center rounded-md border-[1px] border-gray-500">
            <button
              onClick={() => handleTypeChange(undefined)}
              className={`px-3 py-1 text-[10px] md:px-6 md:text-[16px] ${
                currentFilters.type === undefined
                  ? 'bg-gray-500/40 text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => handleTypeChange(TransactionType.INCOME)}
              className={`px-2 py-1 text-[10px] md:px-6 md:text-[16px] ${
                currentFilters.type === TransactionType.INCOME
                  ? 'bg-gray-500/40 text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Revenu
            </button>
            <button
              onClick={() => handleTypeChange(TransactionType.EXPENSE)}
              className={`px-2 py-1 text-[10px] md:px-6 md:text-[16px] ${
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
            className="flex items-center space-x-1 rounded-md border-[1px] border-gray-500 p-1 text-gray-700 hover:bg-gray-100 md:p-2"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="flex flex-row gap-1">
          {/* Category Filter */}
          <select
            value={currentFilters.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="flex w-20 items-center rounded-md border-[1px] border-gray-900/50 p-1 text-[10px] text-gray-900 shadow-sm md:w-32 md:px-4 md:py-1 md:text-[16px]"
          >
            <option value="">Catégories</option>
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
              className="flex w-20 items-center rounded-md border-[1px] border-gray-900/50 p-1 text-[10px] text-gray-900 shadow-sm md:w-32 md:px-4 md:py-1 md:text-[16px]"
            >
              <option value="">Sous-catégories</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {translateCategoryToFrench(subcategory)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Right side filters */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-1 md:space-x-4">
        <div className="mt-2 flex flex-row items-center gap-1 md:mt-0 md:space-x-2">
          {/* Date Range */}
          <div className="flex items-center gap-1 md:space-x-2">
            <input
              type="date"
              placeholder="Date de début"
              className="w-24 rounded-md border-[1px] border-gray-900/50 p-1 text-[12px] text-gray-900 shadow-sm md:w-36 md:px-4 md:py-1 md:text-[16px]"
              value={formatDateForInput(currentFilters.startDate)}
              onChange={(e) => handleDateChange(e.target.value, true)}
            />
            <span className="text-gray-500">à</span>
            <input
              type="date"
              placeholder="Date de fin"
              className="w-24 rounded-md border-[1px] border-gray-900/50 p-1 text-[12px] text-gray-900 shadow-sm md:w-36 md:px-4 md:py-1 md:text-[16px]"
              value={formatDateForInput(currentFilters.endDate)}
              onChange={(e) => handleDateChange(e.target.value, false)}
            />
          </div>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1">
            {/* Conversion Rate Input */}
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-600 md:text-sm">
                Taux(1$)=
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-10 rounded-md border-[1px] border-gray-900/50 p-1 text-[10px] text-gray-900 shadow-sm md:w-16 md:px-2 md:py-1 md:text-[14px]"
                placeholder="2800"
              />
              <span className="text-xs md:text-sm">FC</span>
            </div>
            <button
              onClick={() => onExport('csv', false, conversionRate)}
              className="flex items-center justify-center rounded-[5px] bg-gray-900 p-1 text-sm font-semibold text-white hover:bg-gray-700 md:rounded-md md:p-2"
              title="Exporter en CSV"
            >
              <Download className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
