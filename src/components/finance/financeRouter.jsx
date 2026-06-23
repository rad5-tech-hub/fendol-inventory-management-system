import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AddSales from './add-sales/add-sales';
import AddExpense from './add-expenses/add-expenses';
import FinanceLedger from './ledger/finance-ledger';
import CashDrawer from './cash-drawer/cash-drawer';
import NewSupplier from './supplier/new-supplier';
import ViewAllSupplier from './supplier/view-all-supplier';
import SupplierDashboard from './supplier/supplier-dashboard';
import SupplierLedger from './supplier/supplier-ledger';
import StaffDirectory from './staff/staff-directory';
import StaffPayroll from './staff/payroll';
import StaffAttendance from './staff/attendance';
import StaffAppraisals from './staff/appraisals';

const FinanceNavigations = () => {
  return (
    <Routes>
      <Route path='add-sales' element={<AddSales />} />
      <Route path='add-expenses' element={<AddExpense />} />
      <Route path='ledger' element={<FinanceLedger />} />
      <Route path='cash-drawer' element={<CashDrawer />} />
      <Route path='supplier/new' element={<NewSupplier />} />
      <Route path='supplier/view-all' element={<ViewAllSupplier />} />
      <Route path='supplier/ledger' element={<SupplierLedger />} />
      <Route path='supplier/dashboard' element={<SupplierDashboard />} />
      <Route path='staff/directory' element={<StaffDirectory />} />
      <Route path='staff/payroll' element={<StaffPayroll />} />
      <Route path='staff/attendance' element={<StaffAttendance />} />
      <Route path='staff/appraisals' element={<StaffAppraisals />} />
    </Routes>
  );
};

export default FinanceNavigations;
