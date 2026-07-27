import React from 'react';
import { Routes, Route} from 'react-router-dom';
import NewBatchFish from './process-fish/new-batch';
import BatchProcessing from './process-fish/batch-processing';
import ViewSummary from './view-summary/view-summary.';

const ProcessNavigations = () => {
    
  return (
    <Routes>      
       <Route path='process-fish' element={<NewBatchFish/>}/> 
       <Route path='batch-processing/:id' element={<BatchProcessing/>}/> 
       <Route path='view-summary' element={<ViewSummary/>}/> 
    </Routes>
  );
};

export default ProcessNavigations;
