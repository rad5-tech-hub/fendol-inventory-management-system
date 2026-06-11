import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MaleBroodstock from './male/male-broodstock';
import FemaleBroodstock from './female/female-broodstock';

const BroodstockNavigations = () => {
  return (
    <Routes>
      <Route path='male' element={<MaleBroodstock />} />
      <Route path='female' element={<FemaleBroodstock />} />
      <Route path='*' element={<Navigate to='male' replace />} />
    </Routes>
  );
};

export default BroodstockNavigations;
