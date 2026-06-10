import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TransferToNursery from './transfer-to-nursery/transfer-to-nursery';
import TransferHistory from './transfer-history/transfer-history';

const TransfersNavigations = () => {
  return (
    <Routes>
      <Route path='transfer-to-nursery' element={<TransferToNursery />} />
      <Route path='transfer-history' element={<TransferHistory />} />
    </Routes>
  );
};

export default TransfersNavigations;
