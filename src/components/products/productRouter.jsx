import React from 'react';
import { Routes, Route} from 'react-router-dom';
import CreateProducts from './create-products/create-products';
import ViewAllProducts from './view-all/view-all';

const ProductNavigations = () => {
    
  return (
    <Routes>
      <Route path='create-products' element={<CreateProducts/>}/>
      <Route path='view-all' element={<ViewAllProducts/>}/>
    </Routes>
  );
};

export default ProductNavigations;
