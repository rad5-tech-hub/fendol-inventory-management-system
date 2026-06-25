import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsCalendar3, BsPrinter } from "react-icons/bs";
import Api from "../../shared/api/apiLink";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import PortalDropdown from "../../shared/portal-dropdown/PortalDropdown";
import ReactPaginate from 'react-paginate';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import ReceiptModal from "../../finance/add-sales/receipt";

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

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('');
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
  const [selectedPendingSale, setSelectedPendingSale] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [amountPaidB, setAmountPaidB] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [salesType, setSalesType] = useState("");
  const [description, setDescription] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchLedgerData();
    }
  }, [customerId]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.get(`/customer/${customerId}`);
      if (Array.isArray(response.data.data)) {
        setLedgerData(response.data.data);
        if (response.data.data.length > 0) {
          setFullName(response.data.data[0].fullName);
          setCategory(response.data.data[0].customerCategory);
        }
      } else {
        throw new Error('Expected an array of ledger data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
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
      setPendingSalesError(err.response?.data?.message || 'Failed to fetch pending sales. Please try again.');
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
      const tDate = new Date(record.date);
      if (dateFrom && tDate < new Date(dateFrom)) return false;
      if (dateTo && tDate > new Date(dateTo + 'T23:59:59')) return false;
      if (typeFilter !== 'all') {
        const type = record.productName ? 'sale' : (record.credit > 0 ? 'payment' : 'payment');
        if (type !== typeFilter && typeFilter !== 'all') return false;
      }
      return true;
    });
  }, [ledgerData, dateFrom, dateTo, typeFilter]);

  const pageCount = Math.ceil(filteredLedgerData.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const displayedLedgerData = filteredLedgerData.slice(offset, offset + itemsPerPage);

  const totalCredit = ledgerData.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const totalDebit = ledgerData.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const balance = ledgerData.length > 0 ? ledgerData[0].balanceWithRollover ?? 0 : 0;
  const balanceColor = balance > 0 ? '#16A34A' : balance < 0 ? '#DC2626' : '#6B7280';
  const balanceLabel = balance > 0 ? 'Customer Owes Us' : balance < 0 ? 'We Owe Customer' : 'Settled';

  const handlePageChange = (data) => setCurrentPage(data.selected);

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setCurrentPage(0);
  };

  const hasActiveFilters = dateFrom || dateTo || typeFilter !== 'all';

  const handleAddMoney = () => {
    setShowModal(true);
    fetchPendingSales();
    resetForm();
  };

  const handlePendingSearchChange = (e) => {
    setPendingSearch(e.target.value);
    setShowPendingDropdown(true);
  };

  const handlePendingSelect = (sale) => {
    setSelectedPendingSale(sale.id || "");
    setTransactionId(sale.transactionId || "");
    setTotalAmount(sale.totalPrice - sale.totalPaid - (sale.discount || 0));
    setAmountPaidB(sale.totalPaid || 0);
    setSalesType(sale.paymentType || "");
    setPendingSearch(`${sale.transactionId} - ${sale.salesCategory || 'Unknown Sales Type'} - ₦${(sale.totalPrice - (sale.discount || 0)).toLocaleString()}`);
    setShowPendingDropdown(false);
    setAmountPaid("");
  };

  const filteredPendingSales = pendingSales.filter(sale => {
    const searchTerm = pendingSearch.toLowerCase();
    return (
      sale.transactionId.toLowerCase().includes(searchTerm) ||
      (sale.salesCategory && sale.salesCategory.toLowerCase().includes(searchTerm))
    );
  });

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    setAmountPaid(value ? Number(value) : "");
  };

  const handleSalesTypeChange = (e) => {
    setSalesType(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

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
      toast.error("Please enter an amount to pay.", { position: "top-center", autoClose: 3000 });
      return;
    }
    if (!salesType) {
      toast.error("Please select a payment type.", { position: "top-center", autoClose: 3000 });
      return;
    }
    const loadingToastId = toast.loading("Processing payment...", { position: "top-center" });
    setLoadingPayment(true);
    try {
      const paymentData = {
        customerId,
        salesId: selectedPendingSale || null,
        amountPaid: parseFloat(amountPaid),
        paymentType: salesType,
        description: description || "",
      };
      const response = await Api.post("/add-payment", paymentData);
      toast.update(loadingToastId, { render: "Payment added successfully!", type: "success", isLoading: false, position: "top-center", autoClose: 3000 });
      setShowModal(false);
      resetForm();
      fetchLedgerData();
      fetchPendingSales();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.update(loadingToastId, { render: error.response?.data?.response_message || "Failed to add payment.", type: "error", isLoading: false, position: "top-center", autoClose: 3000 });
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
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>
        <section className={styles.content}>
          <main className={styles.create_form}>
            <ToastContainer />

            {/* ── Breadcrumb ── */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '13px' }}>
              <span style={{ cursor: 'pointer', color: '#8C949B' }} onClick={() => navigate('/customer/view-all')}>
                Customers
              </span>
              <span className="text-muted">›</span>
              <span className="fw-semibold" style={{ color: '#2E3135' }}>Customer Ledger</span>
              <div className="ms-auto d-flex gap-2">
                <Button
                  onClick={handleAddMoney}
                  className={`border-0 btn-dark shadow py-2 px-4 fs-6 fw-semibold ${styles.submit}`}
                  style={{ fontSize: '13px !important', padding: '6px 14px !important', borderRadius: '6px' }}
                >
                  Add Payment
                </Button>
              </div>
            </div>

            {/* ── Page Title ── */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2E3135', marginBottom: '4px' }}>
                  Customer Ledger
                </h2>
                <p style={{ fontSize: '14px', color: '#8C949B', margin: 0 }}>
                  View all transactions and account balance for customers.
                </p>
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
            {!loading && !error && ledgerData.length > 0 && (
              <>
                {/* ── Customer Header Card ── */}
                <div
                  style={{
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
                    padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px',
                  }}
                >
                  <div className="d-flex flex-wrap align-items-start" style={{ gap: '8px', justifyContent: 'space-between' }}>
                    <div className="d-flex align-items-start gap-3">
                      <div
                        style={{
                          width: '60px', height: '60px', borderRadius: '50%',
                          background: AVATAR_COLORS[0], display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '22px', fontWeight: 700,
                          color: '#ffffff', flexShrink: 0,
                        }}
                      >
                        {getInitials(fullName)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1C1E', marginBottom: '4px' }}>
                          {fullName?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#374151', fontWeight: 500, margin: '0 0 8px 0' }}>
                          {category || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="d-flex gap-2 flex-wrap">
                      <div style={{
                        minWidth: '180px', flex: '1 1 auto', background: '#FAFCFF', border: '1px solid #e5e7eb',
                        borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                          Total Credit (N)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>
                          {formatCurrency(totalCredit)}
                        </div>
                      </div>
                      <div style={{
                        minWidth: '180px', flex: '1 1 auto', background: '#FAFCFF', border: '1px solid #e5e7eb',
                        borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                          Total Debit (N)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#DC2626' }}>
                          {formatCurrency(totalDebit)}
                        </div>
                      </div>
                      <div style={{
                        minWidth: '180px', flex: '1 1 auto', background: '#FAFCFF', border: '1px solid #e5e7eb',
                        borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                          Balance (N)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: balanceColor }}>
                          {formatCurrency(balance)}
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
                              fontSize: '12px', color: '#374151', outline: 'none', background: '#ffffff',
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
                              fontSize: '12px', color: '#374151', outline: 'none', background: '#ffffff',
                            }}
                          />
                          <BsCalendar3 style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8C949B' }} />
                        </div>
                      </div>
                    </div>

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

                    <div className="d-flex gap-2" style={{ alignSelf: 'flex-end', paddingBottom: '1px' }}>
                      <button
                        onClick={() => setCurrentPage(0)}
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
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'visible' }}>
                  <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-2">
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#2E3135', margin: 0 }}>
                      Ledger Transactions ({filteredLedgerData.length})
                    </h4>
                  </div>

                  {filteredLedgerData.length === 0 ? (
                    <div className="text-center py-5">
                      <Alert variant="info" className="mx-auto" style={{ maxWidth: '400px' }}>
                        No transactions match your filters.
                      </Alert>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive" style={{ overflow: 'visible' }}>
                        <table className={`table ${styles.styled_tables} mb-0`} style={{ tableLayout: 'fixed' }}>
                          <thead className={styles.theaders}>
                            <tr>
                              <th style={{ width: '14%', fontSize: '11px' }}>DATE</th>
                              <th style={{ width: '28%', fontSize: '11px' }}>DESCRIPTION</th>
                              <th style={{ width: '14%', fontSize: '11px' }}>PAYMENT</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>CREDIT (₦)</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>DEBIT (₦)</th>
                              <th style={{ width: '14%', fontSize: '11px', textAlign: 'right' }}>BALANCE (₦)</th>
                              <th style={{ width: '40px', fontSize: '11px', textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedLedgerData.map((record) => {
                              const balColor = record.balance > 0 ? '#16A34A' : record.balance < 0 ? '#DC2626' : '#6B7280';
                              return (
                                <tr
                                  key={record.id}
                                  style={{ transition: 'background-color 0.12s ease', verticalAlign: 'middle' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td style={{ fontSize: '12px', color: '#8C949B', whiteSpace: 'nowrap' }}>
                                    {formatDate(record.date)}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#2E3135' }}>
                                    <div className="d-flex align-items-center gap-2">
                                      {record.productName && (
                                        <span
                                          style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: '#DBEAFE', color: '#1D4ED8', display: 'inline-flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, flexShrink: 0,
                                          }}
                                        >
                                          S
                                        </span>
                                      )}
                                      <span>{record.productName || record.description || '-'}</span>
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>{record.paymentType || '-'}</td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A', textAlign: 'right' }}>
                                    {record.credit ? formatCurrency(record.credit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', textAlign: 'right' }}>
                                    {record.debit ? formatCurrency(record.debit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: balColor, textAlign: 'right' }}>
                                    {record.balance != null ? formatCurrency(record.balance) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                    <PortalDropdown
                                      btnClass={styles.threeDotBtn}
                                      items={[
                                        ...(record.productName
                                          ? [
                                              { label: <><BsPrinter size={14} style={{ marginRight: 8 }} /> Print Receipt</>, onClick: () => handleReceipt(record) },
                                              { divider: true },
                                            ]
                                          : []),
                                        { label: 'View Details', onClick: () => {} },
                                      ]}
                                    />
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
                          Showing {offset + 1}–{Math.min(offset + itemsPerPage, filteredLedgerData.length)} of {filteredLedgerData.length} records
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

            {!loading && !error && ledgerData.length < 1 && (
              <Alert variant="info" className="text-center w-100 py-5">
                <p className="text-center fw-semibold">No Ledger found</p>
              </Alert>
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
            <div className="text-center">
              <Spinner animation="border" size="sm" role="status">
                <span className="visually-hidden">Loading pending sales...</span>
              </Spinner>
              <p className="mt-2">Loading pending sales...</p>
            </div>
          ) : pendingSalesError ? (
            <p className="text-danger text-center">{pendingSalesError}</p>
          ) : pendingSales.length > 0 ? (
            <Form.Group className="mb-3">
              <Form.Label>Select Pending Sales (Optional)</Form.Label>
              <div style={{ position: "relative" }}>
                <Form.Control
                  type="text"
                  placeholder="Search by Receipt Id or Sales Type..."
                  value={pendingSearch}
                  onChange={handlePendingSearchChange}
                  onFocus={() => setShowPendingDropdown(true)}
                  className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
                />
                {showPendingDropdown && (
                  <div className={`${styles.suggestions_box}`} style={{ maxHeight: "200px", overflowY: "auto" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {filteredPendingSales.length > 0 ? (
                        filteredPendingSales.map((sale, index) => (
                          <li
                            key={index}
                            onClick={() => handlePendingSelect(sale)}
                            style={{ cursor: "pointer", padding: "8px" }}
                          >
                            {`${sale.transactionId} - ${sale.salesCategory || "Unknown Sale Type"} - ₦${(sale.totalPrice - (sale.discount || 0)).toLocaleString()}`}
                          </li>
                        ))
                      ) : (
                        <li style={{ padding: "8px" }}>No pending sales found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Form.Group>
          ) : null}
          {selectedPendingSale && (
            <>
              <p><strong>Amount Paid Before:</strong> ₦{amountPaidB.toLocaleString()}</p>
              <p><strong>Balance:</strong> ₦{totalAmount.toLocaleString()}</p>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Amount Paid</Form.Label>
            <Form.Control
              type="text"
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              value={amountPaid ? Number(amountPaid).toLocaleString() : ""}
              onChange={handleAmountChange}
              placeholder="Enter amount"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Payment Type</Form.Label>
            <Form.Select
              value={salesType}
              className={`py-2 bg-light-subtle shadow-none border-1 ${styles.inputs}`}
              onChange={handleSalesTypeChange}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="POS">POS</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
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
              Pay
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
      <ToastContainer />
    </section>
  );
}
