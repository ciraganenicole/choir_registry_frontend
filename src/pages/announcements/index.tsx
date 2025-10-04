import React from 'react';

import CommuniqueList from '@/components/communique/CommuniqueList';

const AnnouncementsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Chorale Salem
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <CommuniqueList showHeader={true} />
      </div>
    </div>
  );
};

export default AnnouncementsPage;
