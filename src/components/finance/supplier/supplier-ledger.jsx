import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../finance.module.scss';
import { BsThreeDotsVertical, BsCalendar3, BsGeoAlt, BsArrowLeft } from "react-icons/bs";
import { ApiV2 } from '../../shared/api/apiLink';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Alert, Dropdown } from 'react-bootstrap';
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

export default function SupplierLedger() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const supplierId = queryParams.get('id');

  const [supplier, setSupplier] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (supplierId) fetchData();
  }, [supplierId]);

  const fetchData = async (nextCursor) => {
    try {
      setLoading(true);
      setError('');
      const params = nextCursor ? { cursor: nextCursor } : {};
      const response = await ApiV2.get(`/v2/supplier-ledger/${supplierId}`, { params });
      const body = response.data;
      const data = body?.data;

      if (data) {
        setSupplier(data.supplier || null);
        const newEntries = data.entries || [];
        if (nextCursor) {
          setEntries(prev => [...prev, ...newEntries]);
        } else {
          setEntries(newEntries);
        }
        setSummary(body.summary || { totalCredits: 0, totalDebits: 0 });
        setCursor(body.pagination?.nextCursor || null);
        setHasMore(body.pagination?.hasMore || false);
      } else {
        setError("No ledger data found for this supplier.");
      }
    } catch (err) {
      const msg = err.response?.data?.response_message || err.response?.data?.message || "Failed to load supplier ledger.";
      setError(msg);
      toast.error(msg, { className: 'dark-toast', autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (cursor && hasMore && !loading) {
      fetchData(cursor);
    }
  };

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredEntries = entries.filter(e => {
    const eDate = new Date(e.createdAt);
    if (dateFrom && eDate < new Date(dateFrom)) return false;
    if (dateTo && eDate > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  const totalBalance = entries.reduce((sum, e) => sum + Number(e.balance || 0), 0);
  const balanceColor = totalBalance > 0 ? '#16A34A' : totalBalance < 0 ? '#DC2626' : '#6B7280';
  const balanceLabel = totalBalance < 0 ? 'Amount Owed to Supplier' : totalBalance > 0 ? 'Supplier Owes Us' : 'Settled';
  const hasActiveFilters = dateFrom || dateTo;

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
            </div>

            {/* ── Loading ── */}
            {loading && entries.length === 0 && <SkeletonTable cols={6} rows={5} />}

            {/* ── Error ── */}
            {error && !supplier && (
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
                  <div className="d-flex flex-wrap align-items-start" style={{ gap: '8px', justifyContent: 'space-between' }}>
                    {/* Left: Avatar + Info */}
                    <div className="d-flex align-items-start gap-3">
                      <div
                        style={{
                          width: '60px', height: '60px', borderRadius: '50%',
                          background: AVATAR_COLORS[0], display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '22px', fontWeight: 700,
                          color: '#ffffff', flexShrink: 0,
                        }}
                      >
                        {getInitials(supplier.name)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1C1E', marginBottom: '4px' }}>
                          {supplier.name}
                        </h3>
                        <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                          <span className="d-flex align-items-center gap-1">
                            <BsGeoAlt style={{ fontSize: '12px' }} /> {supplier.address || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Metric Cards */}
                    <div className="d-flex gap-2 flex-wrap">
                      <div style={{
                        minWidth: '180px', flex: '1 1 auto', background: '#FAFCFF', border: '1px solid #e5e7eb',
                        borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                          Total Credit (N)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>
                          {formatCurrency(summary.totalCredits)}
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
                          {formatCurrency(summary.totalDebits)}
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
                          {formatCurrency(totalBalance)}
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
                    {/* Date From / To */}
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

                    {/* Buttons */}
                    <div className="d-flex gap-2" style={{ alignSelf: 'flex-end', paddingBottom: '1px' }}>
                      {hasActiveFilters && (
                        <button
                          onClick={() => { setDateFrom(''); setDateTo(''); }}
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
                      Ledger Transactions ({filteredEntries.length})
                    </h4>
                  </div>

                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-5">
                      <Alert variant="info" className="mx-auto" style={{ maxWidth: '400px' }}>
                        {entries.length === 0 ? 'Loading transactions...' : 'No transactions match your filters.'}
                      </Alert>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive" style={{ overflow: 'visible' }}>
                        <table className={`table ${styles.styled_table} mb-0`} style={{ tableLayout: 'fixed' }}>
                          <thead className={styles.theader}>
                            <tr>
                              <th style={{ width: '16%', fontSize: '11px' }}>DATE</th>
                              <th style={{ width: '34%', fontSize: '11px' }}>DESCRIPTION</th>
                              <th style={{ width: '16%', fontSize: '11px', textAlign: 'right' }}>CREDIT (₦)</th>
                              <th style={{ width: '16%', fontSize: '11px', textAlign: 'right' }}>DEBIT (₦)</th>
                              <th style={{ width: '16%', fontSize: '11px', textAlign: 'right' }}>BALANCE (₦)</th>
                              <th style={{ width: '40px', fontSize: '11px', textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEntries.map((tx) => {
                              const credit = Number(tx.credit || 0);
                              const debit = Number(tx.debit || 0);
                              const balance = Number(tx.balance || 0);
                              const txBalColor = balance > 0 ? '#16A34A' : balance < 0 ? '#DC2626' : '#6B7280';
                              return (
                                <tr
                                  key={tx.id}
                                  style={{ transition: 'background-color 0.12s ease', verticalAlign: 'middle' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td style={{ fontSize: '12px', color: '#8C949B', whiteSpace: 'nowrap' }}>
                                    {formatDate(tx.createdAt)}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#2E3135' }}>
                                    {tx.comment || '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A', textAlign: 'right' }}>
                                    {credit ? formatCurrency(credit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', textAlign: 'right' }}>
                                    {debit ? formatCurrency(debit) : '-'}
                                  </td>
                                  <td style={{ fontSize: '13px', fontWeight: 600, color: txBalColor, textAlign: 'right' }}>
                                    {formatCurrency(balance)}
                                  </td>
                                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                    <Dropdown align="end">
                                      <Dropdown.Toggle as="button" className={styles.threeDotBtn}>
                                        <BsThreeDotsVertical size={16} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu style={{ minWidth: 180 }}>
                                        <Dropdown.Item onClick={() => {}}>View Details</Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ── Load More (cursor-based pagination) ── */}
                      {hasMore && (
                        <div className="text-center py-3 border-top" style={{ borderColor: '#e5e7eb' }}>
                          <button
                            onClick={loadMore}
                            disabled={loading}
                            style={{
                              padding: '8px 24px', background: '#512728', color: '#ffffff',
                              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                            }}
                          >
                            {loading ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
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
