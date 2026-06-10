import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateHatchBatch from './create/create-hatch-batch';
import ViewAllBatches from './view-all/view-all-batches';
import HatchBatchSummary from './summary/hatch-batch-summary';

const HatchBatchesRouter = () => {
  return (
    <Routes>
      <Route path='create' element={<CreateHatchBatch />} />
      <Route path='view-all' element={<ViewAllBatches />} />
      <Route path='summary/:batchId' element={<HatchBatchSummary />} />
    </Routes>
  );
};

export default HatchBatchesRouter;
