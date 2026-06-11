import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BatchDashboard from './dashboard/batch-dashboard';
import BatchSummary from './summary/batch-summary';

const BatchDashboardNavigations = () => {
  return (
    <Routes>
      <Route index element={<BatchDashboard />} />
      <Route path='summary' element={<Navigate to='..' replace />} />
      <Route path='summary/:batchId' element={<BatchSummary />} />
    </Routes>
  );
};

export default BatchDashboardNavigations;
