import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';
import CashDrawer from './cash-drawer/cash-drawer';
import { hasAccess } from '../shared/permissions';

const FinanceNavigations = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(sessionStorage.getItem('role'));
  }, []);

  if (role === null) return <div>Loading...</div>;

  return (
    <Routes>
      {hasAccess(role, 'finance:add-sales') && <Route path='add-sales' element={<AddSales/>}/>}
      {hasAccess(role, 'finance:add-expenses') && <Route path='add-expenses' element={<AddExpense/>}/>}
      <Route path='ledger' element={hasAccess(role, 'finance:ledger') ? <FinanceLedger/> : <Navigate to={hasAccess(role, 'finance:add-sales') ? 'add-sales' : '../dashboard'} replace/>}/>
      {hasAccess(role, 'finance:cash-drawer') && <Route path='cash-drawer' element={<CashDrawer/>}/>}
    </Routes>
  );
};

export default FinanceNavigations;
