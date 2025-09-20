import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaPlay,
  FaTimes,
} from 'react-icons/fa';

import { useUpdateRehearsal } from '@/lib/rehearsal/logic';
import { RehearsalStatus } from '@/lib/rehearsal/types';

interface RehearsalStatusUpdaterProps {
  rehearsalId: number;
  currentStatus: RehearsalStatus;
  onStatusChange?: (newStatus: RehearsalStatus) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RehearsalStatusUpdater: React.FC<RehearsalStatusUpdaterProps> = ({
  rehearsalId,
  currentStatus,
  onStatusChange,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateRehearsal } = useUpdateRehearsal();

  const statusOptions = [
    {
      value: RehearsalStatus.PLANNING,
      label: 'Planifiée',
      icon: FaCalendarAlt,
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      description: 'Répétition planifiée',
    },
    {
      value: RehearsalStatus.IN_PROGRESS,
      label: 'En cours',
      icon: FaPlay,
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      description: 'Répétition en cours',
    },
    {
      value: RehearsalStatus.COMPLETED,
      label: 'Terminée',
      icon: FaCheckCircle,
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      description: 'Répétition terminée',
    },
    {
      value: RehearsalStatus.CANCELLED,
      label: 'Annulée',
      icon: FaTimes,
      color: 'bg-red-100 text-red-800 hover:bg-red-200',
      description: 'Répétition annulée',
    },
  ];

  const currentOption = statusOptions.find(
    (option) => option.value === currentStatus,
  );

  const handleStatusChange = async (newStatus: RehearsalStatus) => {
    // Check authentication
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error('Vous devez être connecté pour modifier le statut');
      return;
    }

    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);

    try {
      const success = await updateRehearsal(rehearsalId, { status: newStatus });

      if (success) {
        toast.success('Statut mis à jour avec succès');
        onStatusChange?.(newStatus);
        setIsOpen(false);
      } else {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }

    setIsUpdating(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Status Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        disabled={isUpdating}
        className={`
          inline-flex items-center gap-2 rounded-lg border border-gray-300 
          ${getSizeClasses()}
          ${currentOption?.color || 'bg-gray-100 text-gray-800'}
          transition-all duration-200 hover:shadow-md focus:outline-none
          focus:ring-2 focus:ring-blue-500
          disabled:cursor-not-allowed disabled:opacity-50
        `}
      >
        {currentOption && <currentOption.icon className="text-xs" />}
        <span className="font-medium">
          {isUpdating
            ? 'Mise à jour...'
            : currentOption?.label || currentStatus}
        </span>
        <FaChevronDown
          className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  handleStatusChange(option.value);
                }}
                disabled={isUpdating}
                className={`
                  flex w-full items-center gap-3 px-2 py-1 text-left
                  transition-colors duration-150 hover:bg-gray-50
                  focus:bg-gray-50 focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${option.value === currentStatus ? 'bg-blue-50' : ''}
                `}
              >
                <div className={`rounded-md p-1 ${option.color}`}>
                  <option.icon className="text-xs" />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {option.description}
                  </div>
                </div>
                {option.value === currentStatus && (
                  <div className="text-sm font-bold text-blue-600">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default RehearsalStatusUpdater;
