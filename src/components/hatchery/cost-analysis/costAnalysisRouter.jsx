import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Expenses from './expenses/expenses';
import CostReports from './cost-reports/cost-reports';

const CostAnalysisNavigations = () => {
  return (
    <Routes>
      <Route path='expenses' element={<Expenses />} />
      <Route path='cost-reports' element={<CostReports />} />
    </Routes>
  );
};

export default CostAnalysisNavigations;
