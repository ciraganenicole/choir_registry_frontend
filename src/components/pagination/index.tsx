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

  // Ensure totalPages is a valid number and greater than 0
  const validTotalPages = Math.max(totalPages, 0);

  // Prevent creating an array with invalid length
  if (validTotalPages === 0) {
    return null; // or return a message indicating no pages
  }

  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`rounded border p-[6px] text-[12px] ${currentPage === 1 ? 'cursor-not-allowed bg-gray-500 font-semibold text-white' : 'bg-white hover:bg-gray-200'}`}
      >
        <MdOutlineArrowBackIos />
      </button>

      {[...Array(validTotalPages)].map((_, index) => {
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
        disabled={currentPage === validTotalPages}
        className={`rounded border p-[6px] text-[12px] ${currentPage === validTotalPages ? 'cursor-not-allowed bg-gray-500 font-semibold text-white' : 'bg-white hover:bg-gray-200'}`}
      >
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default Pagination;
