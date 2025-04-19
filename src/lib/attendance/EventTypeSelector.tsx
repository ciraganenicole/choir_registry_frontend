import React from 'react';

import { AttendanceEventType } from './logic';

interface EventTypeSelectorProps {
  selectedEventType: AttendanceEventType;
  onEventTypeChange: (eventType: AttendanceEventType) => void;
}

const eventTypeLabels: Record<AttendanceEventType, string> = {
  [AttendanceEventType.REHEARSAL]: 'Répétition',
  [AttendanceEventType.SUNDAY_SERVICE]: 'Culte D',
  [AttendanceEventType.LOUADO]: 'Louado',
  [AttendanceEventType.MUSIC]: 'Musique',
  [AttendanceEventType.COMMITTEE]: 'Comité',
};

export const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  selectedEventType,
  onEventTypeChange,
}) => {
  return (
    <div className="mb-2 md:mb-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Evénements
      </label>
      <div className="grid grid-cols-3 items-center justify-center gap-2 md:grid-cols-5">
        {Object.entries(eventTypeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => onEventTypeChange(type as AttendanceEventType)}
            className={`rounded-md px-2 py-1 text-[12px] font-medium md:px-4 md:py-2 md:text-sm ${
              selectedEventType === type
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
