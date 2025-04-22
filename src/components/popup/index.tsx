import React from 'react';
import { IoClose } from 'react-icons/io5';

interface PopupProps {
  title?: string;
  children: React.ReactNode;
  style?: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ title, children, onClose, style }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div
        className={`relative flex h-[95vh] w-[90%] flex-col rounded-lg bg-white shadow-md ${style}`}
      >
        {/* Header Section - Fixed */}
        <div className="relative border-b border-gray-200 px-2 py-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-md bg-red-600 p-[2px] text-[16px] font-bold text-white hover:text-red-800"
          >
            <IoClose />
          </button>

          <h2 className="text-start text-[16px] font-bold text-gray-900 md:text-center md:text-[24px]">
            {title}
          </h2>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default Popup;
