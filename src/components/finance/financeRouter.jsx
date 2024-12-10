import React,{useState} from 'react';
import { Routes, Route} from 'react-router-dom';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';
import AddSalary from './staff-salary/staff-salary';

const FinanceNavigations = () => {
  const [role, setRole]= useState(null);

  if(role === null){
    setRole(sessionStorage.getItem('role'));    
  }
  return (
    <Routes>
      <Route path='add-sales' element={<AddSales/>}/>
      <Route path='add-expenses' element={<AddExpense/>}/>
      {role === 'super_admin' && (<>
        <Route path='staff-salary' element={<AddSalary/>}/>
        <Route path='ledger' element={<FinanceLedger/>}/>
      </>)}
    </Routes>
  );
};

export default FinanceNavigations;
