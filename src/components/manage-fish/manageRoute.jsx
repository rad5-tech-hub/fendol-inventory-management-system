import React from 'react';
import { Routes, Route} from 'react-router-dom';
import AddSpecies from './create-fish-type/create-fish-type';
import AddFish from './add-fish/add-fish';
import MoveFish from './move-fish/move-fish';
import HarvestFish from './harvest-fish/harvest';
import DamageFish from './damage-fish/damage-fish';
import ViewAllHistory from './view-all-histories/view-all-histories';
import Sampling from './sampling/sampling';
import ViewFish from './site-transfers/ViewFish';
import TransferFish from './site-transfers/TransferFish';
import History from './site-transfers/History';

const ManageNavigations = () => {
    
  return (
    <Routes>        
      <Route path='create-fish-type' element={<AddSpecies/>}/>      
      <Route path='add-fish' element={<AddFish/>}/>
      <Route path='move-fish' element={<MoveFish/>}/>      
      <Route path='harvest-fish' element={<HarvestFish/>}/>      
      <Route path='damage-fish' element={<DamageFish/>}/>      
      <Route path='view-all-histories' element={<ViewAllHistory/>}/>
      <Route path='sampling' element={<Sampling/>}/>
      <Route path='site-transfers' element={<ViewFish/>}/>
      <Route path='site-transfers/transfer' element={<TransferFish/>}/>
      <Route path='site-transfers/history' element={<History/>}/>
    </Routes>
  );
};

export default ManageNavigations;
