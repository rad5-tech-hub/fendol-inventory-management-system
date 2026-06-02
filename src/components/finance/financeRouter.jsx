import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';
import CashDrawer from './cash-drawer/cash-drawer';

const FinanceNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(sessionStorage.getItem('role'));
  }, []);

  if (role === null) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path='add-sales' element={<AddSales/>}/>
      <Route path='add-expenses' element={<AddExpense/>}/>
      <Route path='ledger' element={role === 'super_admin' ? <FinanceLedger/> : <Navigate to='add-sales' replace/>}/>
      <Route path='cash-drawer' element={<CashDrawer/>}/>
    </Routes>
  );
};

export default FinanceNavigations;
