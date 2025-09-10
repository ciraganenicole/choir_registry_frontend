import React from 'react';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaTimesCircle,
} from 'react-icons/fa';

import {
  getShiftValidationMessage,
  getShiftValidationSeverity,
  useShiftValidation,
} from '@/lib/shift/logic';

interface ShiftValidationStatusProps {
  showDetails?: boolean;
  className?: string;
}

const ShiftValidationStatus: React.FC<ShiftValidationStatusProps> = ({
  showDetails = true,
  className = '',
}) => {
  const {
    validationStatus,
    isLoading,
    error,
    validateSingleActiveShift,
    resolveConflicts,
    updateStatuses,
  } = useShiftValidation();

  const severity = getShiftValidationSeverity(validationStatus);
  const message = getShiftValidationMessage(validationStatus);

  const getSeverityStyles = () => {
    switch (severity) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'success':
        return <FaCheckCircle className="text-green-600" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" />;
      case 'error':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaExclamationTriangle className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-lg border p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          <span className="text-sm font-medium">
            Validating shift configuration...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <FaTimesCircle className="text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Shift Validation Error
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${getSeverityStyles()} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getSeverityIcon()}
          <div>
            <h3 className="text-sm font-medium">
              Statut de validation du shift
            </h3>
            <p className="text-sm">{message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={validateSingleActiveShift}
            className="p-1 text-gray-600 transition-colors hover:text-gray-800"
            title="Refresh validation status"
          >
            <FaSync className="size-4" />
          </button>
        </div>
      </div>

      {showDetails && validationStatus && !validationStatus.isValid && (
        <div className="border-current/20 mt-3 border-t pt-3">
          <div className="text-sm">
            <p className="mb-2 font-medium">Shifts en conflit:</p>
            <ul className="space-y-1">
              {validationStatus.activeShifts.map((shift) => (
                <li key={shift.id} className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-current opacity-60"></span>
                  <span>{shift.name}</span>
                  <span className="text-xs opacity-75">
                    ({shift.leader.firstName} {shift.leader.lastName})
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <button
                onClick={resolveConflicts}
                className="bg-current/20 hover:bg-current/30 rounded px-3 py-1 text-xs transition-colors"
              >
                Résoudre automatiquement les conflits
              </button>
              <button
                onClick={updateStatuses}
                className="bg-current/20 hover:bg-current/30 rounded px-3 py-1 text-xs transition-colors"
              >
                Mettre à jour les statuts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftValidationStatus;
