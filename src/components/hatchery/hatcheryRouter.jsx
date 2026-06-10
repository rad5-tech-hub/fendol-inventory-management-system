import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HatcheryDashboard from './hatchery-dashboard/hatchery-dashboard';
import HatchBatchesRouter from './hatch-batches/hatchBatchesRouter';
import BroodstockNavigations from './broodstock/broodstockRouter';
import FryProductionNavigations from './fry-production/fryProductionRouter';
import TransfersNavigations from './transfers/transfersRouter';

const HatcheryNavigations = () => {
  return (
    <Routes>
      <Route path='dashboard' element={<HatcheryDashboard />} />
      <Route path='hatch-batches/*' element={<HatchBatchesRouter />} />
      <Route path='broodstock/*' element={<BroodstockNavigations />} />
      <Route path='fry-production/*' element={<FryProductionNavigations />} />
      <Route path='transfers/*' element={<TransfersNavigations />} />
    </Routes>
  );
};

export default HatcheryNavigations;
