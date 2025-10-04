import React from 'react';

import Layout from '@/components/layout';
import ReportManager from '@/components/report/ReportManager';

const CommitteeReportsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ReportManager />
      </div>
    </Layout>
  );
};

export default CommitteeReportsPage;
