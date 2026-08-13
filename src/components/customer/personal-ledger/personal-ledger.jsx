import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsCalendar3, BsPlusLg, BsPrinter, BsX } from "react-icons/bs";
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import DataTable from "../../shared/data-table/DataTable";
import Pagination from "../../shared/pagination/Pagination";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import ReceiptModal from "../../finance/add-sales/receipt";

const formatCurrency = (value) => {
  if (value == null) return '₦0.00';
  return `₦${Math.abs(Number(value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getPendingNetPrice = (sale) => {
  const totalPrice = Number(sale.totalPrice) || 0;
  if (sale.priceWithoutDiscount != null) return totalPrice;
  return totalPrice - (Number(sale.discount) || 0);
};

const getPendingBalance = (sale) => getPendingNetPrice(sale) - (Number(sale.totalPaid) || 0);

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.join('. ');
  if (data?.response_message) return data.response_message;
  if (data?.error?.message) return data.error.message;
  if (data?.message) return data.message;
  return fallback;
};

const AVATAR_COLORS = ['#E8A87C', '#5C4033', '#6DBFB8', '#8B6F47', '#A78BFA', '#F5A623', '#4A90D9', '#2E7D32'];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'payment', label: 'Payments' },
  { value: 'sale', label: 'Sales' },
  { value: 'opening', label: 'Opening Balance' },
];

export default function PersonalLedger() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const customerId = queryParams.get('id');
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const userTypes = useSelector((store) => store.user?.userTypes || []);
  const isSuperAdmin = userTypes.includes('super_admin');
  const getSiteId = () => {
    if (isSuperAdmin) return activeSite?.id || '';
    return user?.siteId || user?.userSites?.[0]?.id || activeSite?.id || '';
  };
  const resolvedSiteId = getSiteId();

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 45;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [pendingSales, setPendingSales] = useState([]);
  const [pendingSalesLoading, setPendingSalesLoading] = useState(false);
  const [pendingSalesError, setPendingSalesError] = useState('');
  const [amountPaid, setAmountPaid] = useState("");
  const [salesType, setSalesType] = useState("");
  const [description, setDescription] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedPendingSale, setSelectedPendingSale] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaidB, setAmountPaidB] = useState("");

  useEffect(() => {
    if (customerId) {
      fetchLedgerData();
      fetchCustomerInfo();
    }
  }, [customerId]);

  const fetchCustomerInfo = async () => {
    try {
      const response = await Api.get('/customers');
      const customers = Array.isArray(response.data?.data) ? response.data.data : [];
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setFullName(customer.fullName || '');
        setAddress(customer.address || '');
      }
    } catch (err) {
      console.error('Error fetching customer info:', err);
    }
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      setError('');
      const allData = [];
      let cursor = null;
      let hasMore = true;

      while (hasMore) {
        const params = { limit: 100 };
        if (cursor) params.cursor = cursor;
        const response = await Api.get(`/customer/${customerId}`, { params });
        const body = response.data;
        if (body.success && Array.isArray(body.data)) {
          allData.push(...body.data.map(({ passwordHash, ...rest }) => rest));
          hasMore = body.pagination?.hasMore || false;
          cursor = body.pagination?.nextCursor || null;
        } else {
          throw new Error('Unexpected response format');
        }
      }

      setLedgerData(allData);
      if (allData.length > 0) {
        setFullName(allData[0].fullName);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(extractError(err, 'Failed to fetch ledger data.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSales = async () => {
    setPendingSalesLoading(true);
    setPendingSalesError('');
    try {
      const response = await Api.get(`/customer/${customerId}/pending-sales`);
      const pending = response.data.data;
      setPendingSales(pending);
    } catch (err) {
      console.error('Error fetching pending sales:', err);
      setPendingSalesError(extractError(err, 'Failed to fetch pending sales.'));
    } finally {
      setPendingSalesLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredLedgerData = useMemo(() => {
    return ledgerData.filter(record => {
      const tDate = new Date(record.createdAt);
      if (dateFrom && tDate < new Date(dateFrom)) return false;
      if (dateTo && tDate > new Date(dateTo + 'T23:59:59')) return false;
      if (typeFilter !== 'all') {
        const type = Number(record.debit) > 0 ? 'sale' : Number(record.credit) > 0 ? 'payment' : 'opening';
        if (type !== typeFilter) return false;
      }
      return true;
    });
  }, [ledgerData, dateFrom, dateTo, typeFilter]);

  const pageCount = Math.ceil(filteredLedgerData.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const displayedLedgerData = filteredLedgerData.slice(offset, offset + itemsPerPage);

  const totalCredit = ledgerData.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const totalDebit = ledgerData.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const balance = ledgerData.length > 0 ? Number(ledgerData[0]?.balance || 0) : 0;
  const balanceColor = balance < 0 ? '#DC2626' : balance > 0 ? '#16A34A' : '#6B7280';
  const balanceLabel = balance < 0 ? 'Owes Us' : balance > 0 ? 'We Owe' : 'Settled';

  const handlePageChange = (data) => setCurrentPage(data.selected);

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setCurrentPage(0);
  };

  const hasActiveFilters = dateFrom || dateTo || typeFilter !== 'all';

  const ledgerColumns = [
    { key: 'createdAt', label: 'DATE', width: '14%', render: (value) => <span style={{ color: '#8C949B', whiteSpace: 'nowrap' }}>{formatDate(value)}</span> },
    {
      key: '_description',
      label: 'DESCRIPTION',
      width: '28%',
      render: (_, row) => (
        <div className="d-flex align-items-center gap-2">
          <span>{row.productName || '-'}</span>
        </div>
      ),
    },
    { key: 'paymentType', label: 'PAYMENT', width: '14%', render: (value) => value || '' },
    { key: 'credit', label: 'CREDIT (₦)', width: '14%', align: 'right', render: (value) => Number(value) ? <span style={{ fontWeight: 600, color: '#16A34A' }}>{formatCurrency(value)}</span> : '' },
    { key: 'debit', label: 'DEBIT (₦)', width: '14%', align: 'right', render: (value) => Number(value) ? <span style={{ fontWeight: 600, color: '#DC2626' }}>{formatCurrency(value)}</span> : '' },
    {
      key: 'balance',
      label: 'BALANCE (₦)',
      width: '14%',
      align: 'right',
      render: (value) => {
        if (value == null) return '-';
        const bal = Number(value);
        const color = bal < 0 ? '#DC2626' : bal > 0 ? '#16A34A' : '#6B7280';
        const label = bal < 0 ? 'owes us' : bal > 0 ? 'we owe' : '';
        return (
          <div>
            <div style={{ fontWeight: 600, color }}>{formatCurrency(bal)}</div>
            {label && <div style={{ fontSize: '10px', color, opacity: 0.7, lineHeight: 1.2 }}>{label}</div>}
          </div>
        );
      },
    },
  ];

  const ledgerActions = (row) => (
    <PortalDropdown
      btnClass={styles.threeDotBtn}
      items={[
        { label: <><BsPrinter size={14} style={{ marginRight: 8 }} /> Print Receipt</>, onClick: () => handleReceipt(row) },
      ]}
    />
  );

  const handleAddMoney = () => {
    setShowModal(true);
    fetchPendingSales();
    setAmountPaid("");
    setSalesType("");
    setDescription("");
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    setAmountPaid(value ? Number(value) : "");
  };

  const handleSalesTypeChange = (val) => {
    setSalesType(val);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handlePendingSearchChange = (e) => {
    setPendingSearch(e.target.value);
    setShowPendingDropdown(true);
  };

  const handlePendingSelect = (sale) => {
    setSelectedPendingSale(sale.id || "");
    setTransactionId(sale.transactionId || "");
    setTotalAmount(getPendingBalance(sale));
    setAmountPaidB(sale.totalPaid || 0);
    setSalesType(sale.paymentType || "");
    setPendingSearch(`${sale.transactionId} - ${sale.salesCategory || 'Unknown'} - ₦${getPendingNetPrice(sale).toLocaleString()}`);
    setShowPendingDropdown(false);
    setAmountPaid("");
  };

  const filteredPendingSales = useMemo(() => {
    const term = pendingSearch.toLowerCase();
    return pendingSales.filter(sale =>
      sale.transactionId?.toLowerCase().includes(term) ||
      sale.salesCategory?.toLowerCase().includes(term)
    );
  }, [pendingSales, pendingSearch]);

  const resetForm = () => {
    setSelectedPendingSale("");
    setAmountPaid("");
    setSalesType("");
    setDescription("");
    setPendingSearch("");
    setTransactionId("");
    setTotalAmount(0);
    setAmountPaidB("");
    setShowPendingDropdown(false);
  };

  const handleSubmitAmountPaid = async () => {
    if (!amountPaid) {
      toast.error("Please enter an amount to pay.", { autoClose: 3000 });
      return;
    }
    if (!salesType) {
      toast.error("Please select a payment type.", { autoClose: 3000 });
      return;
    }
    const loadingToastId = toast.loading("Processing payment...");
    setLoadingPayment(true);
    try {
      const paymentData = {
        customerId,
        saleId: selectedPendingSale || null,
        amountPaid: Number(amountPaid),
        paymentType: salesType.toLowerCase(),
        description: description || "",
      };
      if (resolvedSiteId) paymentData.siteId = resolvedSiteId;
      const res = await Api.post("/add-payment", paymentData);
      toast.update(loadingToastId, { render: res.data?.message || "Payment added successfully!", type: "success", isLoading: false, autoClose: 3000 });
      setShowModal(false);
      resetForm();
      fetchLedgerData();
      fetchPendingSales();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.update(loadingToastId, { render: extractError(error, "Failed to add payment."), type: "error", isLoading: false, autoClose: 6000 });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleReceipt = async (record) => {
    const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
    try {
      const receiptResponse = await Api.get(`/sales-receipts/${record.transactionId}`);
      if (receiptResponse.status === 404) throw new Error(receiptResponse.data.message || "Receipt not found.");
      if (receiptResponse.status < 200 || receiptResponse.status >= 300) throw new Error("Receipt could not be fetched.");
      setReceiptData(receiptResponse);
      toast.update(receiptToast, { render: "Receipt fetched successfully!", type: "success", isLoading: false, autoClose: 3000, className: 'dark-toast' });
      setShowReceipt(true);
    } catch (error) {
      toast.update(receiptToast, { render: error.message, type: "error", isLoading: false, autoClose: 3000, className: 'dark-toast' });
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={styles.content} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <main className={styles.create_form} style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <ToastContainer />

            {/* ── Breadcrumb + Header Actions ── */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '13px' }}>
              <span className="text-muted" style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/view-all')}>
                Customers
              </span>
              <span className="text-muted">›</span>
              <span className="fw-semibold" style={{ color: '#2E3135' }}>Customer Ledger</span>
              <div className="ms-auto d-flex gap-2">
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ backgroundColor: '#512728', color: '#fff', fontSize: '13px', padding: '6px 14px', borderRadius: '6px', border: 'none' }}
                  onClick={handleAddMoney}
                >
                  <BsPlusLg /> Add Payment
                </button>
              </div>
            </div>

            {/* ── Page Title ── */}
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>Customer Ledger</h2>
            <p style={{ fontSize: '14px', color: '#8C949B', marginBottom: '20px' }}>
              View all transactions and payments for this customer.
            </p>

            {/* ── Loading ── */}
            {loading && <SkeletonTable cols={7} rows={5} />}

            {/* ── Error ── */}
            {error && <ErrorState message={error} onRetry={() => customerId && fetchLedgerData()} />}

            {/* ── Content ── */}
            {!loading && !error && ledgerData.length > 0 && (
              <>
                {/* ── Customer Header Card ── */}
                <div
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                    padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '16px',
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: AVATAR_COLORS[0], display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '16px', fontWeight: 700,
                        color: '#ffffff', flexShrink: 0,
                      }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1C1E', marginBottom: 0 }}>
                        {fullName?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, margin: 0 }}>
                        {address || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

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
                        {formatCurrency(totalCredit)}
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
                        width: '48px', height: '48px', borderRadius: '10px', background: '#FDF5F5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', color: balanceColor, flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C949B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Current Balance
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 700, color: balanceColor, lineHeight: 1.2 }}>
                        {formatCurrency(balance)}
                      </div>
                      <div style={{ fontSize: '11px', color: balanceColor, opacity: 0.7 }}>
                        {balanceLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Filter Bar ── */}
                <div
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '10px',
                  }}
                >
                  <div className="d-flex flex-wrap align-items-end gap-2">
                    <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px', display: 'block' }}>
                        Date Range
                      </label>
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{
                              width: '100%', padding: '5px 8px 5px 24px',
                              border: '1px solid #e5e7eb', borderRadius: '5px',
                              fontSize: '11px', color: '#374151', outline: 'none', background: '#ffffff',
                            }}
                          />
                          <BsCalendar3 style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#8C949B' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#8C949B' }}>–</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={{
                              width: '100%', padding: '5px 8px 5px 24px',
                              border: '1px solid #e5e7eb', borderRadius: '5px',
                              fontSize: '11px', color: '#374151', outline: 'none', background: '#ffffff',
                            }}
                          />
                          <BsCalendar3 style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#8C949B' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px', display: 'block' }}>
                        Type
                      </label>
                      <CustomDropdown
                        value={typeFilter}
                        onChange={(val) => setTypeFilter(val)}
                        options={TRANSACTION_TYPES}
                      />
                    </div>

                    <div className="d-flex gap-1" style={{ alignSelf: 'flex-end' }}>
                      {hasActiveFilters && (
                        <button
                          className="btn btn-sm d-flex align-items-center gap-1"
                          onClick={resetFilters}
                          style={{
                            background: 'transparent', color: '#6B7280', border: '1px solid #e5e7eb',
                            borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                          }}
                        >
                          <BsX style={{ fontSize: '14px' }} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Ledger Table ── */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'visible' }}>
                  <div className="d-flex align-items-center justify-content-between px-3 pt-2 pb-1">
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#2E3135', margin: 0 }}>
                      Ledger Transactions ({filteredLedgerData.length})
                    </h4>
                  </div>

                  {filteredLedgerData.length === 0 ? (
                    <EmptyState
                      title={ledgerData.length === 0 ? "No transactions available" : "No matches found"}
                      description={ledgerData.length === 0 ? "There are no transactions recorded for this customer yet." : "Try adjusting your date range or type filter."}
                    />
                  ) : (
                    <DataTable
                      columns={ledgerColumns}
                      data={displayedLedgerData}
                      actions={ledgerActions}
                    />
                  )}
                </div>
              </>
            )}

            {!loading && !error && ledgerData.length < 1 && (
              <EmptyState
                title="No transactions available"
                description="There are no transactions recorded for this customer yet."
              />
            )}
            </div>
            {/* ── Pagination ── */}
            {!loading && !error && ledgerData.length > 0 && filteredLedgerData.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                totalItems={filteredLedgerData.length}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                itemName="records"
              />
            )}
          </main>
        </section>
      </div>

      {/* ── Add Payment Modal ── */}
      <Modal show={showModal} size="md" onHide={() => { setShowModal(false); resetForm(); }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pendingSalesLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" role="status">
                <span className="visually-hidden">Loading pending sales...</span>
              </Spinner>
              <p className="mt-2 mb-0">Loading pending sales...</p>
            </div>
          ) : pendingSalesError ? (
            <p className="text-danger text-center mb-3">{pendingSalesError}</p>
          ) : pendingSales.length > 0 ? (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '14px', color: '#374151' }}>
                Select Pending Sale <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
              </Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type="text"
                  placeholder="Search by receipt ID or sales type..."
                  value={pendingSearch}
                  onChange={handlePendingSearchChange}
                  onFocus={() => setShowPendingDropdown(true)}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                />
                {showPendingDropdown && (
                  <div className={styles.suggestions_box} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredPendingSales.length > 0 ? (
                      <ul>
                        {filteredPendingSales.map((sale, i) => (
                          <li key={i} onClick={() => handlePendingSelect(sale)}>
                            <div style={{ fontWeight: 500, color: '#2E3135' }}>{sale.transactionId}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              {sale.salesCategory || 'Sale'} — Balance: {formatCurrency(getPendingBalance(sale))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul><li style={{ color: '#9CA3AF', cursor: 'default' }}>No matching sales</li></ul>
                    )}
                  </div>
                )}
              </div>
            </Form.Group>
          ) : (
            <p className="text-center text-muted mb-3" style={{ fontSize: '13px' }}>No pending sales.</p>
          )}
          {selectedPendingSale && (
            <div className="d-flex gap-3 mb-3 p-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Transaction</span>
                <div style={{ fontWeight: 600, color: '#2E3135', marginTop: '2px' }}>{transactionId || 'N/A'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Amount Paid Before</span>
                <div style={{ fontWeight: 600, color: '#2E3135', marginTop: '2px' }}>{formatCurrency(amountPaidB)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Balance</span>
                <div style={{ fontWeight: 600, color: '#DC2626', marginTop: '2px' }}>{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold" style={{ fontSize: '14px', color: '#374151' }}>Amount Paid</Form.Label>
            <Form.Control
              type="text"
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              value={amountPaid ? Number(amountPaid).toLocaleString() : ""}
              onChange={handleAmountChange}
              placeholder="Enter amount"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold" style={{ fontSize: '14px', color: '#374151' }}>Payment Type</Form.Label>
            <CustomDropdown
              value={salesType}
              required
              onChange={handleSalesTypeChange}
              options={[
                { value: '', label: 'Select Payment Method' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Transfer', label: 'Transfer' },
                { value: 'POS', label: 'POS' },
              ]}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold" style={{ fontSize: '14px', color: '#374151' }}>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={description}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              onChange={handleDescriptionChange}
              placeholder="Enter payment description"
            />
          </Form.Group>
          <div className="text-end">
            <Button
              className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
              onClick={handleSubmitAmountPaid}
              disabled={loadingPayment}
            >
              {loadingPayment ? 'Processing...' : 'Pay'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
    </section>
  );
}
