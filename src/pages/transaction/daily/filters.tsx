import type { DailyContributionFilters } from '../types';

interface FiltersProps {
  onFilterChange: (filters: Partial<DailyContributionFilters>) => void;
  currentFilters: DailyContributionFilters;
}

const DailyFilters = ({ onFilterChange, currentFilters }: FiltersProps) => {
  return (
    <div className="mb-4 flex items-center justify-between md:flex-wrap md:justify-start md:space-x-2">
      <input
        type="date"
        placeholder="Start Date"
        className="rounded-md border-[1px] border-gray-900/50 p-1 text-[12px] text-gray-900 shadow-sm md:px-4 md:text-[14px]"
        value={currentFilters.startDate?.split('T')[0] || ''}
        onChange={(e) =>
          onFilterChange({
            startDate: e.target.value
              ? new Date(e.target.value).toISOString()
              : undefined,
          })
        }
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        placeholder="End Date"
        className="rounded-md border-[1px] border-gray-900/50 p-1 text-[12px] text-gray-900 shadow-sm md:px-4 md:text-[14px]"
        value={currentFilters.endDate?.split('T')[0] || ''}
        onChange={(e) =>
          onFilterChange({
            endDate: e.target.value
              ? new Date(e.target.value).toISOString()
              : undefined,
          })
        }
      />
    </div>
  );
};

export default DailyFilters;
