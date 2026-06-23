import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../finance.module.scss';
import { BsThreeDotsVertical, BsDownload, BsFunnel, BsCalendar3, BsSearch, BsGeoAlt, BsChevronDown } from "react-icons/bs";
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Alert } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
const formatCurrency = (value) => {
  if (value == null) return '₦0.00';
  return `₦${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const MOCK_SUPPLIER = {
  id: '1',
  name: 'Aqua Feed Supplies Ltd.',
  supplierId: 'SUP-0021',
  supplierType: 'Feed Supplier',
  description: 'Premium fish feed and aquaculture supplies',
  location: 'Lagos, Nigeria',
  phone: '+234 801 234 5678',
  email: 'info@aquafeed.com',
  status: 'Active',
  totalCredit: 4250000,
  totalDebit: 2750000,
  balance: 1500000,
};

const MOCK_TRANSACTIONS = [
  { id: 'T1', date: '2025-05-31T10:30:00Z', description: 'Payment received for outstanding invoice', reference: 'PAY-0525-018', credit: 0, debit: 500000, balance: 1500000, type: 'payment' },
  { id: 'T2', date: '2025-05-28T14:15:00Z', description: 'Feed supply delivery - 500 bags Premium Grower', reference: 'BIL-0525-042', credit: 850000, debit: 0, balance: 2000000, type: 'bill' },
  { id: 'T3', date: '2025-05-25T09:00:00Z', description: 'Payment received - Bank Transfer', reference: 'PAY-0525-015', credit: 0, debit: 300000, balance: 1150000, type: 'payment' },
  { id: 'T4', date: '2025-05-22T11:45:00Z', description: 'Feed supply delivery - 300 bags Starter Feed', reference: 'BIL-0525-039', credit: 510000, debit: 0, balance: 1450000, type: 'bill' },
  { id: 'T5', date: '2025-05-20T08:30:00Z', description: 'Payment received - POS', reference: 'PAY-0525-012', credit: 0, debit: 200000, balance: 940000, type: 'payment' },
  { id: 'T6', date: '2025-05-18T16:00:00Z', description: 'Feed supply delivery - 200 bags Finisher Feed', reference: 'BIL-0525-036', credit: 360000, debit: 0, balance: 1140000, type: 'bill' },
  { id: 'T7', date: '2025-05-15T13:20:00Z', description: 'Opening balance carried forward', reference: 'OPN-0525-001', credit: 780000, debit: 0, balance: 780000, type: 'opening' },
  { id: 'T8', date: '2025-05-12T10:00:00Z', description: 'Payment received for outstanding invoice', reference: 'PAY-0525-010', credit: 0, debit: 400000, balance: 0, type: 'payment' },
  { id: 'T9', date: '2025-05-10T09:30:00Z', description: 'Feed supply delivery - 400 bags Starter Feed', reference: 'BIL-0525-033', credit: 680000, debit: 0, balance: 400000, type: 'bill' },
  { id: 'T10', date: '2025-05-08T14:00:00Z', description: 'Payment received - Bank Transfer', reference: 'PAY-0525-008', credit: 0, debit: 150000, balance: -280000, type: 'payment' },
  { id: 'T11', date: '2025-05-05T11:15:00Z', description: 'Feed supply delivery - 250 bags Grower Feed', reference: 'BIL-0525-030', credit: 425000, debit: 0, balance: -130000, type: 'bill' },
  { id: 'T12', date: '2025-05-03T08:45:00Z', description: 'Payment received - POS', reference: 'PAY-0525-005', credit: 0, debit: 100000, balance: -555000, type: 'payment' },
  { id: 'T13', date: '2025-05-01T10:00:00Z', description: 'Feed supply delivery - 350 bags Premium Grower', reference: 'BIL-0525-027', credit: 595000, debit: 0, balance: -455000, type: 'bill' },
  { id: 'T14', date: '2025-04-28T09:30:00Z', description: 'Payment received for outstanding invoice', reference: 'PAY-0425-022', credit: 0, debit: 250000, balance: -1050000, type: 'payment' },
  { id: 'T15', date: '2025-04-25T15:00:00Z', description: 'Feed supply delivery - 500 bags Finisher Feed', reference: 'BIL-0425-024', credit: 900000, debit: 0, balance: -800000, type: 'bill' },
  { id: 'T16', date: '2025-04-22T11:30:00Z', description: 'Payment received - Bank Transfer', reference: 'PAY-0425-019', credit: 0, debit: 350000, balance: -1700000, type: 'payment' },
  { id: 'T17', date: '2025-04-20T08:00:00Z', description: 'Feed supply delivery - 200 bags Starter Feed', reference: 'BIL-0425-021', credit: 340000, debit: 0, balance: -1350000, type: 'bill' },
  { id: 'T18', date: '2025-04-18T13:45:00Z', description: 'Opening balance carried forward', reference: 'OPN-0425-001', credit: 1690000, debit: 0, balance: -1690000, type: 'opening' },
];

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'bill', label: 'Bills/Invoices' },
  { value: 'payment', label: 'Payments' },
  { value: 'opening', label: 'Opening Balance' },
];

export default function SupplierLedger() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const supplierId = queryParams.get('id');

  const [supplier, setSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const itemsPerPage = 7;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [referenceSearch, setReferenceSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [supplierId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.get(`/supplier-ledger/${supplierId}`);
      const data = response.data?.data;
      if (data) {
        setSupplier(data.supplier || MOCK_SUPPLIER);
        setTransactions(data.transactions || MOCK_TRANSACTIONS);
      } else {
        setSupplier(MOCK_SUPPLIER);
        setTransactions(MOCK_TRANSACTIONS);
      }
    } catch {
      setSupplier(MOCK_SUPPLIER);
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    if (dateFrom && tDate < new Date(dateFrom)) return false;
    if (dateTo && tDate > new Date(dateTo + 'T23:59:59')) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (referenceSearch && !t.reference.toLowerCase().includes(referenceSearch.toLowerCase())) return false;
    return true;
  });

  const pageCount = Math.ceil(filteredTransactions.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentTransactions = filteredTransactions.slice(offset, offset + itemsPerPage);

  const handlePageChange = (data) => setCurrentPage(data.selected);

  const applyFilters = () => setCurrentPage(0);
  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setReferenceSearch('');
    setCurrentPage(0);
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const handleDropdownToggle = (transactionId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setActiveDropdown(activeDropdown === transactionId ? null : transactionId);
  };

  const handleClickOutside = () => setActiveDropdown(null);

  const balanceColor = supplier
    ? supplier.balance > 0 ? '#16A34A' : supplier.balance < 0 ? '#DC2626' : '#6B7280'
    : '#6B7280';

  const balanceLabel = supplier
    ? supplier.balance > 0 ? 'Amount Owed to Supplier' : supplier.balance < 0 ? 'Supplier Owes Us' : 'Settled'
    : '';

  const hasActiveFilters = dateFrom || dateTo || typeFilter !== 'all' || referenceSearch;

  const bal = supplier?.balance ?? 0;

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content}`}>
          <main className={styles.create_form}>
            <ToastContainer />

            {/* ── Breadcrumb ── */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '13px' }}>
              <span className="text-muted" style={{ cursor: 'pointer' }} onClick={() => navigate('/finance/ledger')}>
                Finance
              </span>
              <span className="text-muted">›</span>
              <span style={{ cursor: 'pointer', color: '#8C949B' }} onClick={() => navigate('/finance/supplier/view-all')}>
                Suppliers
              </span>
              <span className="text-muted">›</span>
              <span className="fw-semibold" style={{ color: '#2E3135' }}>Supplier Ledger</span>
            </div>

            {/* ── Page Title ── */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>
                  Supplier Ledger
                </h2>
                <p style={{ fontSize: '14px', color: '#8C949B', margin: 0 }}>
                  View all transactions and account balance for suppliers.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#ffffff', color: '#374151', border: '1px solid #e5e7eb',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <BsDownload /> Export Report
                </button>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#512728', color: '#ffffff', border: 'none',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#714445'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#512728'; }}
                >
                  <BsFunnel /> Filter
                </button>
              </div>
            </div>

            {/* ── Loading ── */}
            {loading && <SkeletonTable cols={7} rows={5} />}

            {/* ── Error ── */}
            {error && (
              <div className="d-flex justify-content-center mb-4">
                <Alert variant="danger" className="text-center w-50 py-4">{error}</Alert>
              </div>
            )}

            {/* ── Content ── */}
            {!loading && !error && supplier && (
              <>
                {/* ── Supplier Header Card ── */}
                <div
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
                    padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px',
                  }}
                >
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    {/* Left: Avatar + Info */}
                    <div className="d-flex align-items-start gap-3">
                      <div
                        style={{
                          width: '56px', height: '56px', borderRadius: '50%',
                          background: AVATAR_COLORS[0], display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '20px', fontWeight: 700,
                          color: '#ffffff', flexShrink: 0,
                        }}
                      >
                        {getInitials(supplier.name)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>
                          {supplier.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0' }}>
                          {supplier.description || supplier.supplierType}
                        </p>
                        <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '12px', color: '#8C949B' }}>
                          <span className="d-flex align-items-center gap-1">
                            <BsGeoAlt style={{ fontSize: '11px' }} /> {supplier.location || 'N/A'}
                          </span>
                          <span>{supplier.supplierId}</span>
                          <span
                            style={{
                              background: '#DCFCE7', color: '#166534', borderRadius: '12px',
                              padding: '2px 10px', fontWeight: 600, fontSize: '11px',
                            }}
                          >
                            {supplier.status || 'Active'} Supplier
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Metric Boxes */}
                    <div className="d-flex gap-3 flex-wrap">
                      <div style={{ minWidth: '140px', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                          Total Credit (N)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>
                          {formatCurrency(supplier.totalCredit)}
                        </div>
                      </div>
                      <div style={{ minWidth: '140px', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                          Total Debit (N)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626' }}>
                          {formatCurrency(supplier.totalDebit)}
                        </div>
                      </div>
                      <div style={{ minWidth: '140px', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                          Balance (N)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: balanceColor }}>
                          {formatCurrency(bal)}
                        </div>
                        <div style={{ fontSize: '11px', color: balanceColor, opacity: 0.7 }}>
                          {balanceLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Filter Bar ── */}
                <div
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                    padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px',
                  }}
                >
                  <div className="d-flex flex-wrap align-items-end gap-3">
                    {/* Date From */}
                    <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                        Date Range
                      </label>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{
                              width: '100%', padding: '7px 10px 7px 30px',
                              border: '1px solid #e5e7eb', borderRadius: '6px',
                              fontSize: '12px', color: '#374151', outline: 'none',
                              background: '#ffffff',
                            }}
                          />
                          <BsCalendar3 style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8C949B' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#8C949B' }}>–</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={{
                              width: '100%', padding: '7px 10px 7px 30px',
                              border: '1px solid #e5e7eb', borderRadius: '6px',
                              fontSize: '12px', color: '#374151', outline: 'none',
                              background: '#ffffff',
                            }}
                          />
                          <BsCalendar3 style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8C949B' }} />
                        </div>
                      </div>
                    </div>

                    {/* Transaction Type */}
                    <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                        Transaction Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{
                          width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb',
                          borderRadius: '6px', fontSize: '12px', color: '#374151', outline: 'none',
                          background: '#ffffff', cursor: 'pointer',
                        }}
                      >
                        {TRANSACTION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reference Search */}
                    <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                        Reference
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={referenceSearch}
                          onChange={(e) => setReferenceSearch(e.target.value)}
                          placeholder="Search reference..."
                          style={{
                            width: '100%', padding: '7px 10px 7px 28px',
                            border: '1px solid #e5e7eb', borderRadius: '6px',
                            fontSize: '12px', color: '#374151', outline: 'none',
                            background: '#ffffff',
                          }}
                        />
                        <BsSearch style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#8C949B' }} />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="d-flex gap-2" style={{ alignSelf: 'flex-end', paddingBottom: '1px' }}>
                      <button
                        onClick={applyFilters}
                        style={{
                          padding: '7px 16px', background: '#512728', color: '#ffffff',
                          border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#714445'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#512728'; }}
                      >
                        Apply Filter
                      </button>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          style={{
                            padding: '7px 16px', background: '#ffffff', color: '#6B7280',
                            border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Ledger Table ── */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-2">
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#2E3135', margin: 0 }}>
                      Ledger Transactions ({filteredTransactions.length})
                    </h4>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-5">
                      <Alert variant="info" className="mx-auto" style={{ maxWidth: '400px' }}>
                        No transactions match your filters.
                      </Alert>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className={`table ${styles.styled_table} mb-0`} style={{ tableLayout: 'fixed' }}>
                          <thead className={styles.theader}>
                            <tr>
                              <th style={{ width: '15%', fontSize: '11px' }}>DATE</th>
                              <th style={{ width: '28%', fontSize: '11px' }}>DESCRIPTION</th>
                              <th style={{ width: '15%', fontSize: '11px' }}>REFERENCE</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>CREDIT (₦)</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>DEBIT (₦)</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>BALANCE (₦)</th>
                              <th style={{ width: '40px', fontSize: '11px', textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTransactions.map((tx) => {
                              const txBalColor = tx.balance > 0 ? '#16A34A' : tx.balance < 0 ? '#DC2626' : '#6B7280';
                              return (
                                <tr
                                  key={tx.id}
                                  style={{ transition: 'background-color 0.12s ease', verticalAlign: 'middle' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td style={{ fontSize: '12px', color: '#8C949B', whiteSpace: 'nowrap' }}>
                                    {formatDate(tx.date)}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#2E3135' }}>
                                    <div className="d-flex align-items-center gap-2">
                                      {tx.type === 'payment' && (
                                        <span
                                          style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: '#DCFCE7', color: '#16A34A', display: 'inline-flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, flexShrink: 0,
                                          }}
                                        >
                                          C
                                        </span>
                                      )}
                                      <span>{tx.description}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontFamily: "'Roboto Mono', monospace", fontSize: '12px',
                                      color: '#6B7280', background: '#F3F4F6', padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}>
                                      {tx.reference}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A', textAlign: 'right' }}>
                                    {tx.credit ? formatCurrency(tx.credit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', textAlign: 'right' }}>
                                    {tx.debit ? formatCurrency(tx.debit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: txBalColor, textAlign: 'right' }}>
                                    {formatCurrency(tx.balance)}
                                  </td>
                                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                    <span style={{ cursor: 'pointer' }} onClick={(e) => handleDropdownToggle(tx.id, e)}>
                                      <BsThreeDotsVertical style={{ fontSize: '15px', color: '#6B7280' }} />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ── Pagination ── */}
                      <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ borderColor: '#e5e7eb' }}>
                        <div style={{ fontSize: '13px', color: '#8C949B' }}>
                          Showing {offset + 1}–{Math.min(offset + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} records
                        </div>
                        <ReactPaginate
                          previousLabel={"‹"}
                          nextLabel={"›"}
                          breakLabel="..."
                          pageCount={pageCount}
                          marginPagesDisplayed={2}
                          pageRangeDisplayed={3}
                          onPageChange={handlePageChange}
                          containerClassName={"pagination mb-0"}
                          pageClassName={"page-item"}
                          pageLinkClassName={"page-link"}
                          previousClassName={"page-item"}
                          previousLinkClassName={"page-link"}
                          nextClassName={"page-item"}
                          nextLinkClassName={"page-link"}
                          breakClassName={"page-item"}
                          breakLinkClassName={"page-link"}
                          activeClassName={"active"}
                          forcePage={currentPage}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </main>
        </section>
      </div>
    </section>
  );
}
