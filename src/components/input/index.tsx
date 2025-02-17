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
    bgColor = 'bg-green/5',
    required = false,
    max,
    min,
    disabled,
    onBlur,
  } = props;

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
        className={`${bgColor} ${style} mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
        placeholder={placeholder}
        max={max}
        min={min}
        defaultValue={defaultValue || ''}
        onChange={(e) => {
          props?.onChange?.(e?.target?.value || '');
        }}
        onBlur={onBlur}
        required={required}
        autoComplete="new-password"
        disabled={disabled}
      ></input>
    </div>
  );
};

export default Input;
