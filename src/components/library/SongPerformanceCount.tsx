import React from 'react';

import type { Song } from '@/lib/library/logic';
import { useSongPerformanceCount } from '@/lib/library/logic';

interface SongPerformanceCountProps {
  song: Song;
  showLabel?: boolean;
  className?: string;
}

export const SongPerformanceCount: React.FC<SongPerformanceCountProps> = ({
  song,
  showLabel = true,
  className = '',
}) => {
  const { performanceCount, isLoading } = useSongPerformanceCount(song.id);

  const displayCount = performanceCount?.actualCount ?? song.performed;

  if (isLoading) {
    return (
      <div className={className}>
        {showLabel && <div className="text-xs text-gray-500">Interprété</div>}
        <div className="font-bold text-orange-500">...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && <div className="text-xs text-gray-500">Interprété</div>}
      <div className="font-bold text-orange-500">{displayCount}x</div>
    </div>
  );
};
