import React from 'react';

import CommuniqueManager from '@/components/communique/CommuniqueManager';
import Layout from '@/components/layout';

const AdminAnnouncementsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <CommuniqueManager />
      </div>
    </Layout>
  );
};

export default AdminAnnouncementsPage;
