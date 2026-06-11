import React from 'react';
import { Routes, Route} from 'react-router-dom';
import AddFeed from './add-new/add-new';
import UpdateFeedInventory from './view-all/view-all';
import InventoryHistory from './inventory-history/inventory-history';
import CreateFeedBatch from './production/create-batch';
import FeedProductionHistory from './production/production-history';
import FeedInventoryViewAll from './inventory/view-all';
import FeedInventoryAdd from './inventory/add';
import FeedInventoryUse from './inventory/use';
import FeedInventoryTopUp from './inventory/top-up';

const FeedNavigations = () => {
    
  return (
    <Routes>
      <Route path='add-new' element={<AddFeed/>}/>
      <Route path='view-all' element={<UpdateFeedInventory/>}/>
      <Route path='inventory-history' element={<InventoryHistory/>}/>
      <Route path='production/create' element={<CreateFeedBatch/>}/>
      <Route path='production/history' element={<FeedProductionHistory/>}/>
      <Route path='inventory/view-all' element={<FeedInventoryViewAll/>}/>
      <Route path='inventory/add' element={<FeedInventoryAdd/>}/>
      <Route path='inventory/use' element={<FeedInventoryUse/>}/>
      <Route path='inventory/top-up' element={<FeedInventoryTopUp/>}/>
    </Routes>
  );
};

export default FeedNavigations;
