/* eslint-disable no-plusplus */
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

  const validTotalPages = Math.max(totalPages, 0);

  if (validTotalPages === 0) {
    return null;
  }

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (validTotalPages <= 7) {
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        pages.push(2, 3, '...', validTotalPages - 1, validTotalPages);
      } else if (currentPage >= validTotalPages - 2) {
        pages.push(
          '...',
          validTotalPages - 3,
          validTotalPages - 2,
          validTotalPages - 1,
          validTotalPages,
        );
      } else {
        pages.push(
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          validTotalPages,
        );
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-[2px] text-gray-500"
          >
            ...
          </span>
        );
      }

      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page as number)}
          className={`rounded border px-2 py-[2px] text-[10px] md:text-[12px] ${
            currentPage === page
              ? 'bg-gray-900 font-semibold text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`rounded border p-[4px] text-[12px] md:p-[6px] ${
          currentPage === 1
            ? 'cursor-not-allowed bg-gray-500 font-semibold text-white'
            : 'bg-white hover:bg-gray-200'
        }`}
      >
        <MdOutlineArrowBackIos />
      </button>

      {renderPageNumbers()}

      <button
        onClick={handleNext}
        disabled={currentPage === validTotalPages}
        className={`rounded border p-[4px] text-[12px] md:p-[6px] ${
          currentPage === validTotalPages
            ? 'cursor-not-allowed bg-gray-500 font-semibold text-white'
            : 'bg-white hover:bg-gray-200'
        }`}
      >
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default Pagination;
