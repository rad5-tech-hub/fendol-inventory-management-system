import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasPermission } from '../shared/permissions/permissions';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';
import CashDrawer from './cash-drawer/cash-drawer';
import NewSupplier from './supplier/new-supplier';
import ViewAllSupplier from './supplier/view-all-supplier';
import SupplierDashboard from './supplier/supplier-dashboard';
import StaffDirectory from './staff/staff-directory';
import StaffPayroll from './staff/payroll';
import StaffAttendance from './staff/attendance';
import StaffAppraisals from './staff/appraisals';

// Suppliers are super-admin only — block direct URL access for other roles
const SupplierGuard = ({ children }) => {
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  if (!hasPermission(userTypes, 'supplier')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const FinanceNavigations = () => {
  return (
    <Routes>
      <Route path='add-sales' element={<AddSales />} />
      <Route path='add-expenses' element={<AddExpense />} />
      <Route path='ledger' element={<FinanceLedger />} />
      <Route path='cash-drawer' element={<CashDrawer />} />
      <Route path='supplier/new' element={<SupplierGuard><NewSupplier /></SupplierGuard>} />
      <Route path='supplier/view-all' element={<SupplierGuard><ViewAllSupplier /></SupplierGuard>} />
      <Route path='supplier/dashboard' element={<SupplierGuard><SupplierDashboard /></SupplierGuard>} />
      <Route path='staff/directory' element={<StaffDirectory />} />
      <Route path='staff/payroll' element={<StaffPayroll />} />
      <Route path='staff/attendance' element={<StaffAttendance />} />
      <Route path='staff/appraisals' element={<StaffAppraisals />} />
    </Routes>
  );
};

export default FinanceNavigations;
