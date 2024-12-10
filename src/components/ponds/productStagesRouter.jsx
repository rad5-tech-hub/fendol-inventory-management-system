import React from 'react';
import { Routes, Route} from 'react-router-dom';
import CreateStages from './create/create-stages';
import ViewAllStages from './view-all-ponds/view-all-stages';

const ProductStagesNavigations = () => {
    
  return (
    <Routes>
      <Route path='create' element={<CreateStages/>}/>
      <Route path='view-all-ponds' element={<ViewAllStages/>}/>          
    </Routes>
  );
};

export default ProductStagesNavigations;
