import React,{useState} from 'react';
import { Routes, Route} from 'react-router-dom';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';

const FinanceNavigations = () => {
  return (
    <Routes>
      <Route path='add-sales' element={<AddSales/>}/>
      <Route path='add-expenses' element={<AddExpense/>}/>
      <Route path='ledger' element={<FinanceLedger/>}/>
    </Routes>
  );
};

export default FinanceNavigations;
