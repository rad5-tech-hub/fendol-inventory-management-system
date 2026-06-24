import React, { useState, useEffect, useRef } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../finance.module.scss';
import { BsSearch, BsThreeDotsVertical, BsPlusLg, BsChevronDown, BsX } from "react-icons/bs";
import { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Alert, Dropdown } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import { useConfirm } from '../../shared/confirm-modal';

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];

const BALANCE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Suppliers' },
  { value: 'owed', label: 'Owed to Supplier' },
  { value: 'owes', label: 'Supplier Owes Us' },
  { value: 'zero', label: 'No Balance' },
];

const formatCurrency = (value) => {
  if (value == null) return '₦0.00';
  return `₦${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

export default function ViewAllSupplier() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isSuperAdminOrMD = user?.userTypes?.some(t => t === 'super_admin' || t === 'MD');
  const [showSidebar, setShowSidebar] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({ totalSuppliers: 0, totalCredits: 0, totalDebits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierTypes, setSupplierTypes] = useState([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeFilterRef = useRef(null);
  const itemsPerPage = 10;
  const [ConfirmDialog, confirm] = useConfirm();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiV2.get('/v2/supplier');
      const data = response.data?.data;
      const summ = response.data?.summary;
      if (Array.isArray(data)) {
        setSuppliers(data);
      }
      if (summ) {
        setSummary(summ);
      }
    } catch {
      setError("Failed to load suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierTypes = async () => {
    try {
      const res = await ApiV2.get('/v2/supplier-type');
      const types = res.data?.data || [];
      setSupplierTypes(types);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchSupplierTypes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedTypeFilter, balanceFilter]);

  const getSupplierTypeName = (s) => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    return s.name || '';
  };

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    const typeName = getSupplierTypeName(s.supplierType);
    const matchesSearch = !searchQuery
      || s.name?.toLowerCase().includes(q)
      || (s.phone || '').includes(q);
    const matchesType = !selectedTypeFilter || typeName === selectedTypeFilter;
    let matchesBalance = true;
    if (balanceFilter === 'owed') matchesBalance = (s.balance || 0) > 0;
    else if (balanceFilter === 'owes') matchesBalance = (s.balance || 0) < 0;
    else if (balanceFilter === 'zero') matchesBalance = (s.balance || 0) === 0;
    return matchesSearch && matchesType && matchesBalance;
  });

  const pageCount = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(offset, offset + itemsPerPage);

  const handleDelete = async (supplier) => {
    const ok = await confirm({ message: `Are you sure you want to delete ${supplier.name}?`, title: 'Confirm Delete', variant: 'danger' });
    if (!ok) return;
    const loadingToast = toast.loading('Deleting Supplier...', { className: 'dark-toast' });
    try {
      const res = await ApiV2.delete(`/v2/supplier/${supplier.id}`);
      setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
      toast.update(loadingToast, {
        render: res.data?.response_message || 'Supplier deleted successfully!',
        type: 'success', isLoading: false, autoClose: 3000, className: 'dark-toast'
      });
    } catch (err) {
      const msg = err.response?.data?.response_message || err.response?.data?.message || 'Failed to delete supplier.';
      toast.update(loadingToast, {
        render: msg, type: 'error', isLoading: false, autoClose: 5000, className: 'dark-toast'
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTypeFilter('');
    setBalanceFilter('all');
  };

  const hasActiveFilters = searchQuery || selectedTypeFilter || balanceFilter !== 'all';

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const TYPE_COLORS = [
    { bg: '#DBEAFE', text: '#1D4ED8' },
    { bg: '#F3E8FF', text: '#7C3AED' },
    { bg: '#D1FAE5', text: '#047857' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#E0E7FF', text: '#4338CA' },
    { bg: '#FDF5F5', text: '#512728' },
    { bg: '#ECFDF5', text: '#065F46' },
  ];

  const getTypeColor = (type) => {
    if (!type) return { bg: '#F3F4F6', text: '#374151' };
    const name = typeof type === 'string' ? type : (type.name || '');
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length];
  };

  return (
    <section className={`${styles.body}`}>
      <ConfirmDialog />
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

            {/* ── Breadcrumb + Header Actions ── */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '13px' }}>
              <span
                className="text-muted"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/finance/ledger')}
              >
                Purchases
              </span>
              <span className="text-muted">›</span>
              <span className="fw-semibold" style={{ color: '#2E3135' }}>Suppliers</span>
              <div className="ms-auto d-flex gap-2">
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ backgroundColor: '#512728', color: '#fff', fontSize: '13px', padding: '6px 14px', borderRadius: '6px', border: 'none' }}
                  onClick={() => navigate('/finance/supplier/new')}
                >
                  <BsPlusLg /> Add Supplier
                </button>
              </div>
            </div>

            {/* ── Page Title ── */}
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>Suppliers</h2>
            <p style={{ fontSize: '14px', color: '#8C949B', marginBottom: '20px' }}>
              View and manage all your suppliers in one place.
            </p>

            {/* ── Stat Cards ── */}
            <div className="d-flex gap-3 mb-4 flex-wrap">
              <div
                className="d-flex align-items-center gap-3 flex-fill"
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                  padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: '200px',
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '10px', background: '#FDF5F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: '#512728', flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Total Suppliers
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#2E3135', lineHeight: 1.2 }}>
                    {summary.totalSuppliers ?? suppliers.length}
                  </div>
                </div>
              </div>
              <div
                className="d-flex align-items-center gap-3 flex-fill"
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                  padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: '200px',
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '10px', background: '#F0FDF4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: '#16A34A', flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Total Credit
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#16A34A', lineHeight: 1.2 }}>
                    {formatCurrency(summary.totalCredits ?? 0)}
                  </div>
                </div>
              </div>
              <div
                className="d-flex align-items-center gap-3 flex-fill"
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                  padding: '18px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: '200px',
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '10px', background: '#FEF2F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: '#DC2626', flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Total Debit
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>
                    {formatCurrency(summary.totalDebits ?? 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Controls Bar ── */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              {/* Search */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', background: '#ffffff',
                  border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0 14px',
                  gap: '8px', minWidth: '280px', maxWidth: '400px', flex: '1 1 auto',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#512728'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(81,39,40,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <BsSearch style={{ fontSize: '14px', color: '#8C949B', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search suppliers by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none', outline: 'none', fontSize: '13px', color: '#2E3135',
                    background: 'transparent', width: '100%', padding: '9px 0',
                  }}
                />
                {searchQuery && (
                  <span
                    style={{ fontSize: '14px', color: '#8C949B', cursor: 'pointer', lineHeight: 1, padding: '2px' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <BsX />
                  </span>
                )}
              </div>

              {/* Filters */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Supplier Type Filter */}
                <div className="position-relative" ref={typeFilterRef}>
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{
                      background: selectedTypeFilter ? '#512728' : '#ffffff',
                      color: selectedTypeFilter ? '#ffffff' : '#374151',
                      border: `1px solid ${selectedTypeFilter ? '#512728' : '#e5e7eb'}`,
                      borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 500,
                      transition: 'all 0.12s ease',
                    }}
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    {selectedTypeFilter || 'Supplier Type'}
                    <BsChevronDown style={{ fontSize: '11px', marginLeft: '4px' }} />
                  </button>
                  {showTypeDropdown && (
                    <div
                      style={{
                        position: 'absolute', top: '100%', left: 0, zIndex: 1050, marginTop: '4px',
                        minWidth: '200px', background: '#ffffff', border: '1px solid #e5e7eb',
                        borderRadius: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: selectedTypeFilter === '' ? '#512728' : '#374151', fontWeight: selectedTypeFilter === '' ? 600 : 400, backgroundColor: selectedTypeFilter === '' ? '#fdf5f5' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                        onClick={() => { setSelectedTypeFilter(''); setShowTypeDropdown(false); }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFCFF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTypeFilter === '' ? '#fdf5f5' : 'transparent'}
                      >
                        All Types
                      </div>
                      {supplierTypes.map((type) => (
                        <div
                          key={type.id}
                          style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: selectedTypeFilter === type.name ? '#512728' : '#374151', fontWeight: selectedTypeFilter === type.name ? 600 : 400, backgroundColor: selectedTypeFilter === type.name ? '#fdf5f5' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                          onClick={() => { setSelectedTypeFilter(type.name); setShowTypeDropdown(false); }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFCFF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTypeFilter === type.name ? '#fdf5f5' : 'transparent'}
                        >
                          {type.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balance Filter */}
                <div
                  className="d-flex"
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden',
                  }}
                >
                  {BALANCE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: balanceFilter === opt.value ? 600 : 500,
                        border: 'none', background: balanceFilter === opt.value ? '#512728' : 'transparent',
                        color: balanceFilter === opt.value ? '#ffffff' : '#374151', cursor: 'pointer',
                        transition: 'all 0.12s ease', borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap',
                      }}
                      onClick={() => setBalanceFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{
                      background: 'transparent', color: '#6B7280', border: '1px solid #e5e7eb',
                      borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                    }}
                    onClick={resetFilters}
                  >
                    <BsX style={{ fontSize: '14px' }} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <Alert variant="danger" className="text-center">{error}</Alert>
            )}

            {/* ── Loading ── */}
            {loading && <SkeletonTable cols={6} rows={5} />}

            {/* ── Empty ── */}
            {!loading && !error && filteredSuppliers.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-4">
                  {searchQuery || selectedTypeFilter || balanceFilter !== 'all'
                    ? 'No suppliers match your filters.'
                    : 'No suppliers available.'}
                </Alert>
              </div>
            )}

            {/* ── Table ── */}
            {!loading && !error && filteredSuppliers.length > 0 && (
              <>
                <div className="table-responsive" style={{ overflow: 'visible' }}>
                  <table className={`table ${styles.styled_table} mb-0`} style={{ tableLayout: 'fixed' }}>
                    <thead className={styles.theader}>
                      <tr>
                        <th style={{ width: '100px', fontSize: '11px' }}>DATE ADDED</th>
                        <th style={{ width: '26%', fontSize: '11px' }}>SUPPLIER</th>
                        <th style={{ width: '18%', fontSize: '11px' }}>SUPPLIER TYPE</th>
                        <th style={{ width: '16%', fontSize: '11px' }}>PHONE</th>
                        <th style={{ width: '18%', fontSize: '11px', textAlign: 'right' }}>BALANCE (₦)</th>
                        <th style={{ width: '50px', fontSize: '11px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSuppliers.map((supplier, idx) => {
                        const balance = supplier.balance || 0;
                        const balanceColor = balance > 0 ? '#16A34A' : balance < 0 ? '#DC2626' : '#6B7280';
                        const balanceLabel = balance > 0 ? 'Owed to Supplier' : balance < 0 ? 'Supplier Owes Us' : 'Settled';
                        const typeName = getSupplierTypeName(supplier.supplierType);
                        const typeColor = getTypeColor(supplier.supplierType);
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                        return (
                          <tr
                            key={supplier.id}
                            style={{ transition: 'background-color 0.12s ease', verticalAlign: 'middle' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ fontSize: '12px', color: '#8C949B', whiteSpace: 'nowrap' }}>
                              {new Date(supplier.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  style={{
                                    width: '34px', height: '34px', borderRadius: '50%', background: avatarColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: 700, color: '#ffffff', flexShrink: 0,
                                  }}
                                >
                                  {getInitials(supplier.name)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E3135' }}>{supplier.name}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {typeName ? (
                                <span
                                  style={{
                                    display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                                    fontSize: '12px', fontWeight: 600, background: typeColor.bg, color: typeColor.text,
                                  }}
                                >
                                  {typeName}
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>—</span>
                              )}
                            </td>
                            <td style={{ fontSize: '13px', color: '#374151' }}>{supplier.phone}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: balanceColor }}>{formatCurrency(balance)}</div>
                              <div style={{ fontSize: '11px', color: balanceColor, opacity: 0.7 }}>{balanceLabel}</div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <Dropdown align="end">
                                <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                  <BsThreeDotsVertical size={16} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu style={{ minWidth: 180 }}>
                                  <Dropdown.Item onClick={() => navigate('/finance/supplier/new', { state: { supplier } })}>
                                    Edit
                                  </Dropdown.Item>
                                  {isSuperAdminOrMD && (
                                    <Dropdown.Item onClick={() => handleDelete(supplier)}>Delete</Dropdown.Item>
                                  )}
                                  <Dropdown.Divider />
                                  <Dropdown.Item onClick={() => navigate(`/finance/supplier/ledger?id=${supplier.id}`)}>
                                    View Ledger
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div style={{ fontSize: '13px', color: '#8C949B' }}>
                    Showing {offset + 1}–{Math.min(offset + itemsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length}
                  </div>
                  <ReactPaginate
                    previousLabel={"‹"}
                    nextLabel={"›"}
                    breakLabel="..."
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={(data) => setCurrentPage(data.selected)}
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
          </main>
        </section>
      </div>
    </section>
  );
}
