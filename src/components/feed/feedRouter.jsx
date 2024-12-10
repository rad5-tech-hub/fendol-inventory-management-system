import React from 'react';
import { Routes, Route} from 'react-router-dom';
import AddFeed from './add-new/add-new';
import UpdateFeedInventory from './view-all/view-all';
import InventoryHistory from './inventory-history/inventory-history';

const FeedNavigations = () => {
    
  return (
    <Routes>
      <Route path='add-new' element={<AddFeed/>}/>
      <Route path='view-all' element={<UpdateFeedInventory/>}/>
      <Route path='inventory-history' element={<InventoryHistory/>}/>
    </Routes>
  );
};

export default FeedNavigations;
