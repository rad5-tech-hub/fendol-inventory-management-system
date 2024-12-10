import React from 'react';
import { Routes, Route} from 'react-router-dom';
import NewBatchFish from './process-fish/new-batch';
import ViewSummary from './view-summary/view-summary.';

const ProcessNavigations = () => {
    
  return (
    <Routes>      
       <Route path='process-fish' element={<NewBatchFish/>}/> 
       <Route path='view-summary' element={<ViewSummary/>}/> 
    </Routes>
  );
};

export default ProcessNavigations;
