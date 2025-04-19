import React from 'react';

import type { Props } from './type';

const Input: React.FC<Props> = (props: Props) => {
  const {
    label,
    placeholder,
    style,
    icon,
    type,
    defaultValue,
    value,
    name,
    bgColor = 'bg-green/5',
    required = false,
    max,
    min,
    disabled,
    onBlur,
    onChange,
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // If the parent expects just the value (string)
      if (onChange.length === 1) {
        onChange(e.target.value);
      } else {
        // If the parent expects the full event
        onChange(e);
      }
    }
  };

  return (
    <div className={`flex-1 sm:mb-5`}>
      {label && (
        <span className="block text-sm font-medium text-gray-700">
          {label}
          {icon}
        </span>
      )}
      <input
        type={type || 'text'}
        name={name}
        className={`${bgColor} ${style || ''} mt-2 block w-full rounded-md border border-gray-500 px-4 py-1 text-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-black`}
        placeholder={placeholder}
        max={max}
        min={min}
        defaultValue={defaultValue || ''}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        required={required}
        autoComplete="new-password"
        disabled={disabled}
      />
    </div>
  );
};

export default Input;
