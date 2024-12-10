import React from 'react';
import { Routes, Route} from 'react-router-dom';
import AddCustomer from './add/add';
import ViewAll from './view-all/view-all';
import PersonalLedger from './personal-ledger/personal-ledger';
const CustomerNavigations = () => {
    
  return (
    <Routes>
      <Route path='add' element={<AddCustomer/>}/>
      <Route path='view-all' element={<ViewAll/>}/>      
      <Route path='personal-ledger' element={<PersonalLedger/>}/>
    </Routes>
  );
};

export default CustomerNavigations;
