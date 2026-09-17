import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ViewAll from './view-all/view-all';
import StoreItemDetail from './store-item-detail/store-item-detail';
import InventoryHistory from './inventory-history/inventory-history';
import StoreStockUse from './stock/use';
import StoreStockTopUp from './stock/top-up';

const StoreNavigations = () => {
    
  return (
    <Routes>
      <Route path='view-all' element={<ViewAll/>}/>
      <Route path='detail/:storeId' element={<StoreItemDetail/>}/>
      <Route path='inventory-history' element={<InventoryHistory/>}/>
      <Route path='stock/use' element={<StoreStockUse/>}/>
      <Route path='stock/top-up' element={<StoreStockTopUp/>}/>
    </Routes>
  );
};

export default StoreNavigations;
