import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsSearch, BsPlusLg, BsX } from "react-icons/bs";
import Api from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import { Alert, Modal, Button, Form } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { useNavigate } from "react-router-dom";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import { useConfirm } from '../../shared/confirm-modal';
import { formatPhone, handlePhoneChange, normalizePhone } from '../../shared/phoneUtils';

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];

const CATEGORY_OPTIONS = ['Marketer', 'Customer'];

const BALANCE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Customers' },
  { value: 'owed', label: 'Owes Us' },
  { value: 'owes', label: 'We Owe' },
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

export default function ViewAllCustomers() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;
  const [aggregates, setAggregates] = useState({ totalCustomers: 0, totalDebtors: 0, totalOutstandingDebt: 0 });
  const [ConfirmDialog, confirm] = useConfirm();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const getApiFilter = () => {
    if (balanceFilter === 'owed') return 'debtors';
    if (balanceFilter === 'owes') return 'creditors';
    return undefined;
  };

  const fetchCustomers = async (filter) => {
    try {
      setLoading(true);
      setError('');
      const params = filter ? { filter } : {};
      const allData = [];
      let cursor = null;
      let hasMore = true;
      let agg = { totalCustomers: 0, totalDebtors: 0, totalOutstandingDebt: 0 };

      while (hasMore) {
        const queryParams = { ...params, limit: 100 };
        if (cursor) queryParams.cursor = cursor;
        const response = await Api.get('/customers', { params: queryParams });
        const body = response.data;
        if (body.success && Array.isArray(body.data)) {
          allData.push(...body.data.map(({ passwordHash, ...rest }) => rest));
          agg = body.aggregates || agg;
          hasMore = body.pagination?.hasMore || false;
          cursor = body.pagination?.nextCursor || null;
        } else {
          throw new Error("Unexpected response format");
        }
      }

      setCustomers(allData);
      setAggregates(agg);
    } catch (err) {
      setError('Failed to fetch customers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchCustomers(getApiFilter());
  }, [balanceFilter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory]);

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery
      || c.fullName?.toLowerCase().includes(q)
      || (c.phone || '').includes(q)
      || (c.category || '').toLowerCase().includes(q)
      || (c.address || '').toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    let matchesBalance = true;
    if (balanceFilter === 'zero') {
      const bal = Number(c.balance) || 0;
      matchesBalance = bal === 0;
    }
    return matchesSearch && matchesCategory && matchesBalance;
  });

  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentCustomers = filteredCustomers.slice(offset, offset + itemsPerPage);

  const handleDelete = async (customer) => {
    const ok = await confirm({ message: `Are you sure you want to delete ${customer.fullName}?`, title: 'Confirm Delete', variant: 'danger' });
    if (!ok) return;
    const loadingToast = toast.loading('Deleting Customer...', { className: 'dark-toast' });
    try {
      await Api.delete(`/delete-customer/${customer.id}`);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      toast.update(loadingToast, { render: 'Customer deleted successfully!', type: 'success', isLoading: false, autoClose: 3000, className: 'dark-toast' });
    } catch {
      toast.update(loadingToast, { render: 'Failed to delete customer.', type: 'error', isLoading: false, autoClose: 3000, className: 'dark-toast' });
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoadingEdit(true);
    const loadingToast = toast.loading('Saving Customer...');
    try {
      const payload = { ...selectedCustomer, phone: selectedCustomer.phone ? normalizePhone(selectedCustomer.phone) : '' };
      await Api.put(`/customer/${selectedCustomer.id}`, payload);
      toast.update(loadingToast, { render: 'Customer saved successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      fetchCustomers(getApiFilter());
      setShowModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast.update(loadingToast, { render: 'Failed to save customer. Please try again.', type: 'error', isLoading: false, autoClose: 6000 });
    } finally {
      setLoadingEdit(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setBalanceFilter('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory || balanceFilter !== 'all';

  const columns = [
    {
      key: 'createdAt',
      label: 'DATE ADDED',
      width: '100px',
      render: (value) => (
        <span style={{ color: '#8C949B', whiteSpace: 'nowrap' }}>
          {new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'fullName',
      label: 'CUSTOMER',
      width: '26%',
      render: (value, row, idx) => (
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#ffffff', flexShrink: 0 }}>
            {getInitials(row.fullName)}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E3135' }}>{row.fullName}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'CATEGORY', width: '18%', render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { key: 'phone', label: 'PHONE', width: '16%' },
    {
      key: 'balance',
      label: 'BALANCE (₦)',
      width: '18%',
      align: 'right',
      render: (value) => {
        const bal = Number(value) || 0;
        const displayBal = Math.abs(bal);
        const balanceColor = bal < 0 ? '#DC2626' : bal > 0 ? '#16A34A' : '#6B7280';
        const balanceLabel = bal < 0 ? 'Owes Us' : bal > 0 ? 'We Owe' : '';
        return (
          <>
            <div style={{ fontSize: '14px', fontWeight: 700, color: balanceColor }}>{formatCurrency(displayBal)}</div>
            <div style={{ fontSize: '11px', color: balanceColor, opacity: 0.7 }}>{balanceLabel}</div>
          </>
        );
      },
    },
  ];

  const tableActions = (row) => (
    <PortalDropdown
      btnClass={styles.threeDotBtn}
      items={[
        { label: 'Edit', onClick: () => handleEdit(row) },
        { label: 'Delete', onClick: () => handleDelete(row) },
        { divider: true },
        { label: 'View Ledger', onClick: () => navigate(`/customer/personal-ledger?id=${row.id}`) },
      ]}
    />
  );

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ConfirmDialog />
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={`${styles.content}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <main className={styles.create_form} style={{ height: '100%', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '40px' }}>
            <ToastContainer />

            {/* ── Header Actions ── */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '13px' }}>
              <span className="fw-semibold" style={{ color: '#2E3135' }}>Customers</span>
              <div className="ms-auto d-flex gap-2">
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ backgroundColor: '#512728', color: '#fff', fontSize: '13px', padding: '6px 14px', borderRadius: '6px', border: 'none' }}
                  onClick={() => navigate('/customer/add')}
                >
                  <BsPlusLg /> Add Customer
                </button>
              </div>
            </div>

            {/* ── Page Title ── */}
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>Customers</h2>
            <p style={{ fontSize: '14px', color: '#8C949B', marginBottom: '20px' }}>
              View and manage all your customers in one place.
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
                    Total Customers
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#2E3135', lineHeight: 1.2 }}>
                    {aggregates.totalCustomers}
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
                    Total Outstanding Debt
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc3545', lineHeight: 1.2 }}>
                    {formatCurrency(Math.abs(Number(aggregates.totalOutstandingDebt)))}
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Total Debtors
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>
                    {aggregates.totalDebtors}
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
                  placeholder="Search customers by name, phone, category or address..."
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
                {/* Category Filter */}
                <CustomDropdown
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  options={CATEGORY_OPTIONS.map(cat => ({ value: cat, label: cat }))}
                  placeholder="All Categories"
                  className="w-100"
                />

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
                        padding: '6px 12px', fontSize: '12px',
                        fontWeight: balanceFilter === opt.value ? 600 : 500,
                        border: 'none', background: balanceFilter === opt.value ? '#512728' : 'transparent',
                        color: balanceFilter === opt.value ? '#ffffff' : '#374151',
                        cursor: 'pointer', transition: 'all 0.12s ease',
                        borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap',
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
            {!loading && !error && filteredCustomers.length === 0 && (
              <div className="d-flex justify-content-center">
                <Alert variant="info" className="text-center w-50 py-4">
                  {searchQuery || selectedCategory || balanceFilter !== 'all'
                    ? 'No customers match your filters.'
                    : 'No customers available.'}
                </Alert>
              </div>
            )}

            {/* ── Table ── */}
            {!loading && !error && filteredCustomers.length > 0 && (
              <DataTable
                columns={columns}
                data={currentCustomers}
                actions={tableActions}
              />
            )}
            </div>
            {!loading && !error && filteredCustomers.length > 0 && (
              <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px 24px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#8C949B' }}>
                  Showing {offset + 1}–{Math.min(offset + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
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
            )}
          </main>
        </section>
      </div>

      {/* ── Edit Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0 pt-5">
          {selectedCustomer && (
            <Form>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Full Name</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={selectedCustomer.fullName}
                    onChange={handleInputChange}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Phone</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={selectedCustomer.phone ? formatPhone(selectedCustomer.phone) : ''}
                    required
                    placeholder="+234 801 2345 678"
                    onChange={(e) => handleInputChange({ target: { name: 'phone', value: handlePhoneChange(e) } })}
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Address</Form.Label>
                <div className="col-8">
                  <Form.Control
                    type="text"
                    name="address"
                    value={selectedCustomer.address}
                    onChange={handleInputChange}
                    required
                    className="py-2 shadow-none border-secondary-subtle border-1"
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3 row">
                <Form.Label className="col-4 fw-semibold">Category</Form.Label>
                <div className="col-8">
                  <CustomDropdown
                    name="category"
                    value={selectedCustomer.category}
                    required
                    onChange={(val) => handleInputChange({ target: { name: 'category', value: val } })}
                    options={[
                      { value: '', label: 'Select Category' },
                      { value: 'Marketer', label: 'Marketer' },
                      { value: 'Customer', label: 'Customer' },
                    ]}
                  />
                </div>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-end mt-5">
          <Button
            variant="dark"
            className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
            onClick={handleSave}
            disabled={loadingEdit}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
