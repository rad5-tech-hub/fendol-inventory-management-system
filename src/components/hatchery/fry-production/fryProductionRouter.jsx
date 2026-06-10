import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DailyRecords from './daily-records/daily-records';
import MortalityRecords from './mortality-records/mortality-records';

const FryProductionNavigations = () => {
  return (
    <Routes>
      <Route path='daily-records' element={<DailyRecords />} />
      <Route path='mortality-records' element={<MortalityRecords />} />
    </Routes>
  );
};

export default FryProductionNavigations;
