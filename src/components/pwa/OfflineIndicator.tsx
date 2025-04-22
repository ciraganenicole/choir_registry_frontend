import { WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-yellow-100 p-4 shadow-lg md:left-auto md:right-4 md:w-96">
      <div className="flex items-center gap-3">
        <WifiOff className="size-5 text-yellow-600" />
        <div>
          <h3 className="text-sm font-semibold text-yellow-800">
            Mode hors ligne
          </h3>
          <p className="mt-1 text-xs text-yellow-700">
            Certaines fonctionnalités peuvent être limitées
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
