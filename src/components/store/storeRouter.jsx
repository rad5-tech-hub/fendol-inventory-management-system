import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AddFeed from './add-new/add-new';
import ViewAll from './view-all/view-all';
import InventoryHistory from './inventory-history/inventory-history';
import StoreStockUse from './stock/use';
import StoreStockTopUp from './stock/top-up';

const StoreNavigations = () => {
    
  return (
    <Routes>
      <Route path='add-new' element={<AddFeed/>}/>
      <Route path='view-all' element={<ViewAll/>}/>
      <Route path='inventory-history' element={<InventoryHistory/>}/>
      <Route path='stock/use' element={<StoreStockUse/>}/>
      <Route path='stock/top-up' element={<StoreStockTopUp/>}/>
    </Routes>
  );
};

export default StoreNavigations;
