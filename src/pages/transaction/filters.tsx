import { Download, SlidersHorizontal } from 'lucide-react';
import { LuFilter } from 'react-icons/lu';

const TransactionFilters: React.FC = () => {
  return (
    <div className="my-8 flex flex-row items-center justify-between">
      <div className="flex flex-row items-center rounded-md border-[1px] border-gray-500">
        <button
          onClick={() => console.log('Income')}
          className="rounded-l-md bg-gray-500/40 px-6 py-1 text-gray-900"
        >
          Income
        </button>
        <button
          onClick={() => console.log('Expenses')}
          className="rounded-r-md px-6 py-1 text-gray-500"
        >
          Expenses
        </button>
      </div>

      <div className="flex flex-row items-center gap-2">
        {/* <SearchInput onSearch={() => console.log('Search')}/> */}

        <button className="flex items-center rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm">
          <LuFilter className="mr-2 size-4" /> Category
        </button>

        <button className="flex items-center rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm">
          <SlidersHorizontal className="mr-2 size-4" /> SubCategory
        </button>

        <button className="flex items-center rounded-md border-[1px] border-gray-900/50 px-4 py-1 text-gray-900 shadow-sm">
          <Download className="mr-2 size-4" /> Export
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters;
