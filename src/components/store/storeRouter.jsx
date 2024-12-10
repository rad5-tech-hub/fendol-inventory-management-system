import React from 'react';
import { Routes, Route} from 'react-router-dom';
import AddStock from './add-new/add-new';
import UpdateStoreInventory from './view-all/view-all';
import InventoryHistory from './inventory-history/inventory-history';

const StoreNavigations = () => {
    
  return (
    <Routes>
      <Route path='add-new' element={<AddStock/>}/>
      <Route path='view-all' element={<UpdateStoreInventory/>}/>
      <Route path='inventory-history' element={<InventoryHistory/>}/>
    </Routes>
  );
};

export default StoreNavigations;
