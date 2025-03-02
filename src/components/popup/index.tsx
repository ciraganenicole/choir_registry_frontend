import React from 'react';
import { IoClose } from 'react-icons/io5';

interface PopupProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div className="relative w-[90%] rounded-lg bg-white p-8 shadow-md md:w-1/3">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-8 top-4 rounded-md bg-red-600 p-[2px] text-[16px] font-bold text-white hover:text-red-800"
        >
          <IoClose />
        </button>

        {/* Title */}
        <h2 className="mb-8 mt-4 text-center text-[24px] font-bold text-gray-900">
          {title}
        </h2>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default Popup;
