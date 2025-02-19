import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchInputProps {
  onSearch: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex w-[300px] items-center justify-center gap-2 rounded-md border-[1px] border-gray-600 px-4 py-2">
      <FaSearch className="text-gray-600" />
      <input
        type="text"
        value={query}
        onChange={handleSearchChange}
        placeholder="Search"
        className="w-full border-none bg-white/0 text-gray-900 outline-none focus:border-b-[1px] focus:border-gray-600"
      />
    </div>
  );
};

export default SearchInput;
