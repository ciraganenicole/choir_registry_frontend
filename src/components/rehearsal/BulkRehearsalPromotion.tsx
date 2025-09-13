import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
} from 'react-icons/fa';

import {
  useBulkPromotion,
  usePromotableRehearsals,
} from '@/lib/performance/logic';

interface BulkRehearsalPromotionProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const BulkRehearsalPromotion: React.FC<BulkRehearsalPromotionProps> = ({
  onClose,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const {
    rehearsals,
    loading: loadingRehearsals,
    error: rehearsalsError,
    refetch,
  } = usePromotableRehearsals();
  const {
    promoteRehearsals,
    isLoading: promoting,
    error: promotionError,
    result,
    clearResult,
  } = useBulkPromotion();

  const promotableRehearsals = rehearsals.filter(
    (rehearsal) => !rehearsal.isPromoted,
  );

  // Handle checkbox selection
  const handleSelectRehearsal = useCallback(
    (rehearsalId: number, checked: boolean) => {
      if (checked) {
        setSelectedIds((prev) => [...prev, rehearsalId]);
      } else {
        setSelectedIds((prev) => prev.filter((id) => id !== rehearsalId));
      }
    },
    [],
  );

  // Select all/none
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(promotableRehearsals.map((r) => r.id));
      } else {
        setSelectedIds([]);
      }
    },
    [promotableRehearsals],
  );

  // Promote selected rehearsals
  const handlePromoteRehearsals = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const promotionResult = await promoteRehearsals(selectedIds);

    if (promotionResult && promotionResult.success > 0) {
      // Refresh the list after successful promotion
      refetch();
      setSelectedIds([]);
      onSuccess?.();
    }
  }, [selectedIds, promoteRehearsals, refetch, onSuccess]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
    clearResult();
  }, [clearResult]);

  const isAllSelected =
    selectedIds.length === promotableRehearsals.length &&
    promotableRehearsals.length > 0;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < promotableRehearsals.length;

  // Update indeterminate state when selection changes
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  if (loadingRehearsals) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <FaSpinner className="animate-spin text-blue-500" />
            <span>Loading rehearsals...</span>
          </div>
        </div>
      </div>
    );
  }

  if (rehearsalsError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3 text-red-600">
            <FaExclamationTriangle />
            <span>Error loading rehearsals</span>
          </div>
          <p className="mb-4 text-gray-600">{rehearsalsError}</p>
          <div className="flex gap-2">
            <button
              onClick={refetch}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-[95%] max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Promote Rehearsals to Performances
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Songs will be <strong>added</strong> to the performance
              (duplicates will be skipped)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <FaTimes className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {/* Information Banner */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-blue-600" />
              <div className="text-sm">
                <p className="mb-1 font-medium text-blue-900">
                  How Bulk Promotion Works
                </p>
                <ul className="space-y-1 text-blue-800">
                  <li>
                    • Only <strong>completed</strong> and{' '}
                    <strong>not yet promoted</strong> rehearsals can be promoted
                  </li>
                  <li>
                    • Songs are <strong>added</strong> to the performance (not
                    replaced)
                  </li>
                  <li>• Duplicate songs are automatically skipped</li>
                  <li>
                    • You can promote multiple rehearsals to the same
                    performance
                  </li>
                  <li>• Existing performance songs are preserved</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Select All Controls */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                ref={selectAllRef}
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">
                Select All ({selectedIds.length}/{promotableRehearsals.length})
              </span>
            </label>
          </div>

          {/* Rehearsals List */}
          <div className="mb-6 space-y-3">
            {promotableRehearsals.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <FaExclamationTriangle className="mx-auto mb-4 size-12 text-gray-300" />
                <p>No rehearsals available for promotion</p>
                <p className="mt-2 text-sm">
                  {rehearsals.length > 0
                    ? 'All rehearsals have already been promoted or are not completed'
                    : 'No rehearsals found'}
                </p>
              </div>
            ) : (
              rehearsals
                .filter((rehearsal) => !rehearsal.isPromoted) // Filter out already promoted rehearsals
                .map((rehearsal) => (
                  <div
                    key={rehearsal.id}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rehearsal.id)}
                        onChange={(e) =>
                          handleSelectRehearsal(rehearsal.id, e.target.checked)
                        }
                        className="mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {rehearsal.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-2 rounded-full ${rehearsal.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}
                            ></div>
                            <span
                              className={`text-sm font-medium ${
                                rehearsal.status === 'Completed'
                                  ? 'text-green-700'
                                  : 'text-yellow-700'
                              }`}
                            >
                              {rehearsal.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Performance:</strong>{' '}
                            {rehearsal.performanceTitle}
                          </p>
                          <p>
                            <strong>Date:</strong>{' '}
                            {new Date(
                              rehearsal.rehearsalDate,
                            ).toLocaleDateString()}
                          </p>
                          {rehearsal.location && (
                            <p>
                              <strong>Location:</strong> {rehearsal.location}
                            </p>
                          )}
                          {rehearsal.duration && (
                            <p>
                              <strong>Duration:</strong> {rehearsal.duration}{' '}
                              minutes
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">
                Promotion Results
              </h3>
              <div className="mb-3 flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span className="font-medium text-green-700">
                  {result.success} rehearsal{result.success !== 1 ? 's' : ''}{' '}
                  promoted successfully
                </span>
              </div>
              {result.errors.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-red-700">Errors:</h4>
                  <div className="space-y-1">
                    {result.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-red-600"
                      >
                        <FaTimes className="size-3" />
                        <span>
                          Rehearsal {error.rehearsalId}: {error.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {promotionError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <FaExclamationTriangle />
                <span className="font-medium">Promotion Error</span>
              </div>
              <p className="mt-1 text-red-600">{promotionError}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex gap-2">
            <button
              onClick={handleClearSelection}
              disabled={selectedIds.length === 0}
              className="rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Clear Selection
            </button>
            {result && (
              <button
                onClick={clearResult}
                className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Clear Results
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              Close
            </button>
            <button
              onClick={handlePromoteRehearsals}
              disabled={selectedIds.length === 0 || promoting}
              className="flex items-center gap-2 rounded bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {promoting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <FaCheck />
                  Promote {selectedIds.length} Rehearsal
                  {selectedIds.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkRehearsalPromotion;
