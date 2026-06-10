import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BatchDashboard from './dashboard/batch-dashboard';
import BatchSummary from './summary/batch-summary';

const BatchDashboardNavigations = () => {
  return (
    <Routes>
      <Route index element={<BatchDashboard />} />
      <Route path='summary/:batchId' element={<BatchSummary />} />
    </Routes>
  );
};

export default BatchDashboardNavigations;
