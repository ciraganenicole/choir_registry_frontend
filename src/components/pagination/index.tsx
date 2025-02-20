import React from 'react';
import { MdArrowForwardIos, MdOutlineArrowBackIos } from 'react-icons/md';

type PaginationProps = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`rounded border p-[6px] text-[12px] ${currentPage === 1 ? 'cursor-not-allowed bg-gray-500 font-semibold text-white' : 'bg-white hover:bg-gray-200'}`}
      >
        <MdOutlineArrowBackIos />
      </button>

      {[...Array(totalPages)].map((_, index) => {
        const pageNumber = index + 1;
        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`rounded border px-2 py-[2px] text-[12px] ${currentPage === pageNumber ? 'bg-gray-900 font-semibold text-white' : 'hover:bg-gray-200'}`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`rounded border p-[6px] text-[12px] ${currentPage === totalPages ? 'cursor-not-allowed bg-gray-500 font-semibold text-white' : 'bg-white hover:bg-gray-200'}`}
      >
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default Pagination;
