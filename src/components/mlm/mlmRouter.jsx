import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MlmTree from './tree/tree';
import MlmLeaders from './leaders/leaders';
import MlmPayouts from './payouts/payouts';
import MlmEarnings from './earnings/earnings';

const MlmNavigations = () => {
  return (
    <Routes>
      <Route path='tree' element={<MlmTree />} />
      <Route path='leaders' element={<MlmLeaders />} />
      <Route path='payouts' element={<MlmPayouts />} />
      <Route path='earnings' element={<MlmEarnings />} />
    </Routes>
  );
};

export default MlmNavigations;
