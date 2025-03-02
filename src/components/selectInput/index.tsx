import React, { useEffect, useState } from 'react';
import Select from 'react-select';

interface SelectInputProps {
  options: { value: string; label: string }[];
  onChange: (selected: any) => void;
  placeholder?: string;
  isMulti?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
  options = [],
  onChange,
  placeholder = 'Select...',
  isMulti = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectOptions, setSelectOptions] = useState(options);
  const [selectedOptions, setSelectedOptions] = useState<any>(
    isMulti ? [] : null,
  );

  // Sync external options with internal state
  useEffect(() => {
    setSelectOptions(options);
  }, [options]);

  // Handle new option creation
  const handleCreateOption = () => {
    if (
      inputValue.trim() &&
      !selectOptions.some((option) => option.label === inputValue)
    ) {
      const newOption = { value: inputValue, label: inputValue };
      setSelectOptions((prev) => [...prev, newOption]);

      const newSelected = isMulti ? [...selectedOptions, newOption] : newOption;
      setSelectedOptions(newSelected);
      onChange(newSelected);
    }
  };

  // Handle input change (search box)
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  // Handle option selection
  const handleChange = (selected: any) => {
    setSelectedOptions(selected);
    onChange(selected);
  };

  return (
    <div>
      <Select
        isMulti={isMulti}
        options={selectOptions}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateOption();
          }
        }}
        value={selectedOptions}
        placeholder={placeholder}
        isSearchable
      />
    </div>
  );
};

export default SelectInput;
