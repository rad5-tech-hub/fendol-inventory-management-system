import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MaleBroodstock from './male/male-broodstock';
import FemaleBroodstock from './female/female-broodstock';

const BroodstockNavigations = () => {
  return (
    <Routes>
      <Route path='male' element={<MaleBroodstock />} />
      <Route path='female' element={<FemaleBroodstock />} />
    </Routes>
  );
};

export default BroodstockNavigations;
