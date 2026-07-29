import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import styles from "../finance.module.scss";
import { Spinner, Modal, Button, Form } from "react-bootstrap";
import ErrorState from "../../shared/error-state/ErrorState";
import EmptyState from "../../shared/empty-state/EmptyState";
import { toast, ToastContainer } from "react-toastify";
import Api from "../../shared/api/apiLink";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import DataTable from "../../shared/data-table/DataTable";
import CustomDropdown from "../../shared/custom-dropdown/CustomDropdown";
import Pagination from "../../shared/pagination/Pagination";

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(". ");
    if (data.response_message) return data.response_message;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  }
  return fallback;
};

const formatCurrency = (value) => {
  if (value == null) return '₦0.00';
  return `₦${Math.abs(Number(value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' },
];

const CashDrawer = () => {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 45;

  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addCashAmount, setAddCashAmount] = useState("");
  const [addCashDescription, setAddCashDescription] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const isSuperAdmin = user?.userTypes?.includes("super_admin");
  const resolvedSiteId = isSuperAdmin ? (activeSite?.id || '') : (user?.siteId || user?.userSites?.[0] || '');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (resolvedSiteId) params.siteId = resolvedSiteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      let allData = [];
      let cursor = null;
      let hasNext = true;

      while (hasNext) {
        if (cursor) params.cursor = cursor;
        const res = await Api.get("/cash", { params });
        const body = res.data;
        if (body.success && Array.isArray(body.data)) {
          allData.push(...body.data);
          hasNext = body.pagination?.hasNextPage || false;
          cursor = body.pagination?.nextCursor || null;
        } else {
          throw new Error(body.response_message || "Unexpected response format from server.");
        }
      }
      setEntries(allData);
    } catch (err) {
      const msg = extractError(err, "Failed to fetch cash drawer entries.");
      setError(msg);
      toast.error(msg, { className: "dark-toast" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFrom, dateTo, resolvedSiteId]);

  useEffect(() => {
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) return;
    fetchEntries();
  }, [fetchEntries, dateFrom, dateTo]);

  const formatNumberWithCommas = (number) =>
    number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const handleAmountChange = (e, setAmount) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!isNaN(raw) && raw !== "") {
      setAmount(formatNumberWithCommas(raw));
    } else {
      setAmount("");
    }
  };

  const handleAddCash = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addCashAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid positive amount.", { className: "dark-toast" });
      return;
    }
    if (!addCashDescription.trim()) {
      toast.error("Please enter a description.", { className: "dark-toast" });
      return;
    }
    setModalLoading(true);
    try {
      const payload = { amount, description: addCashDescription, isWithdrawal: false };
      if (resolvedSiteId) payload.siteId = resolvedSiteId;
      const res = await Api.post("/add-cash-to-drawer", payload);
      toast.success(res.data?.response_message || "Cash added successfully!", { className: "dark-toast" });
      setShowAddCashModal(false);
      setAddCashAmount("");
      setAddCashDescription("");
      fetchEntries();
    } catch (err) {
      const msg = extractError(err, "Failed to add cash.");
      toast.error(msg, { className: "dark-toast" });
    } finally {
      setModalLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid positive amount.", { className: "dark-toast" });
      return;
    }
    if (!withdrawDescription.trim()) {
      toast.error("Please enter a description.", { className: "dark-toast" });
      return;
    }
    setModalLoading(true);
    try {
      const payload = { amount, description: withdrawDescription, isWithdrawal: true };
      if (resolvedSiteId) payload.siteId = resolvedSiteId;
      const res = await Api.post("/add-cash-to-drawer", payload);
      toast.success(res.data?.response_message || "Withdrawal successful!", { className: "dark-toast" });
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawDescription("");
      fetchEntries();
    } catch (err) {
      const msg = extractError(err, "Withdrawal failed.");
      toast.error(msg, { className: "dark-toast" });
    } finally {
      setModalLoading(false);
    }
  };

  const toggleSidebar = () => setShowSidebar((prev) => !prev);
  const handleCloseSidebar = () => setShowSidebar(false);

  const handlePageChange = ({ selected }) => setCurrentPage(selected);

  const resetFilters = () => {
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0);
  };

  const filteredEntries = useMemo(() => {
    if (typeFilter === "all") return entries;
    return entries.filter((r) => {
      if (typeFilter === "withdrawal") return r.isWithdrawal === true || Number(r.debit) > 0;
      return r.isWithdrawal === false || Number(r.credit) > 0;
    });
  }, [entries, typeFilter]);

  const displayedEntries = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const totalDeposits = filteredEntries.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const totalWithdrawals = filteredEntries.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const currentBalance = filteredEntries.length > 0 ? Number(filteredEntries[0]?.balance || 0) : 0;
  const balanceColor = currentBalance < 0 ? '#DC2626' : currentBalance > 0 ? '#16A34A' : '#6B7280';
  const balanceLabel = currentBalance < 0 ? 'Negative' : currentBalance > 0 ? 'Positive' : 'Zero';

  const startIndex = currentPage * itemsPerPage;

  return (
    <section className={`${styles.body}`} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2" style={{ flex: 1, overflow: 'hidden' }}>
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <main className={`${styles.create_form}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 mb-3 gap-3 align-items-md-center">
              <h4 className="mb-3 mb-md-0">Cash Drawer</h4>
              <div className="d-flex gap-2">
                <Button
                  className={`border-0 btn-dark shadow py-2 px-3 fs-6 fw-semibold ${styles.submit}`}
                  onClick={() => setShowAddCashModal(true)}
                  style={{ minWidth: '140px', padding: '10px 24px' }}
                >
                  Add Cash
                </Button>
                <Button
                  className={`border-0 btn-dark shadow py-2 px-3 fs-6 fw-semibold ${styles.submit}`}
                  onClick={() => setShowWithdrawModal(true)}
                  style={{ minWidth: '140px', padding: '10px 24px' }}
                >
                  Withdraw
                </Button>
              </div>
            </div>

            {/* ── Filter Bar (always visible) ── */}
            <div
              style={{
                background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px',
                padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '10px',
                opacity: loading ? 0.55 : 1,
                pointerEvents: loading ? 'none' : 'auto',
                transition: 'opacity 0.15s ease',
              }}
            >
              <div className="d-flex flex-wrap align-items-end gap-2">
                <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px', display: 'block' }}>
                    Date Range
                  </label>
                  <div className="d-flex align-items-center gap-1">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(0); }}
                      style={{
                        width: '100%', padding: '5px 8px',
                        border: '1px solid #e5e7eb', borderRadius: '5px',
                        fontSize: '11px', color: '#374151', outline: 'none', background: '#ffffff',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#8C949B' }}>–</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(0); }}
                      style={{
                        width: '100%', padding: '5px 8px',
                        border: '1px solid #e5e7eb', borderRadius: '5px',
                        fontSize: '11px', color: '#374151', outline: 'none', background: '#ffffff',
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px', display: 'block' }}>
                    Type
                  </label>
                  <CustomDropdown
                    value={typeFilter}
                    onChange={(val) => { setTypeFilter(val); setCurrentPage(0); }}
                    options={TRANSACTION_TYPES}
                  />
                </div>
                <div className="d-flex gap-1" style={{ alignSelf: 'flex-end' }}>
                  {(dateFrom || dateTo || typeFilter !== 'all') && (
                    <button
                      onClick={resetFilters}
                      style={{
                        padding: '5px 12px', background: '#ffffff', color: '#6B7280',
                        border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '11px', fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Summary Cards (always visible; skeleton while loading) ── */}
            <div
              style={{
                background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px',
                padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '10px',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              <div className="d-flex flex-wrap gap-3">
                <div style={{
                  background: '#FAFCFF', border: '1px solid #e5e7eb',
                  borderRadius: '8px', padding: '10px 16px', flex: '1 1 auto',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Total Deposits
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A', lineHeight: 1.2 }}>
                    {loading ? '\u2014' : formatCurrency(totalDeposits)}
                  </div>
                </div>
                <div style={{
                  background: '#FAFCFF', border: '1px solid #e5e7eb',
                  borderRadius: '8px', padding: '10px 16px', flex: '1 1 auto',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Total Withdrawals
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>
                    {loading ? '\u2014' : formatCurrency(totalWithdrawals)}
                  </div>
                </div>
                <div style={{
                  background: '#FAFCFF', border: '1px solid #e5e7eb',
                  borderRadius: '8px', padding: '10px 16px', flex: '1 1 auto',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#8C949B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Current Balance
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: loading ? '#6B7280' : balanceColor, lineHeight: 1.2 }}>
                    {loading ? '\u2014' : formatCurrency(currentBalance)}
                  </div>
                  <div style={{ fontSize: '10px', color: loading ? '#6B7280' : balanceColor, opacity: 0.7, lineHeight: 1 }}>
                    {loading ? '\u2014' : balanceLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Table Area (loading / error / empty / data) ── */}
            {loading && <SkeletonTable cols={6} rows={5} />}

            {!loading && error && (
              <div style={{ padding: '20px 0' }}>
                <ErrorState message={error} />
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    onClick={() => fetchEntries()}
                    style={{
                      padding: '8px 24px', background: '#111827', color: '#fff',
                      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && filteredEntries.length === 0 && (
              <div style={{ padding: '20px 0' }}>
                <EmptyState
                  title={dateFrom || dateTo || typeFilter !== "all" ? "No matches found" : "No cash drawer entries found"}
                  description={dateFrom || dateTo || typeFilter !== "all" ? "Try adjusting your date range or type filter above." : "Add cash to the drawer to get started."}
                />
              </div>
            )}

            {!loading && !error && filteredEntries.length > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'visible' }}>
                <div className="d-flex align-items-center justify-content-between px-3 pt-2 pb-1">
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#2E3135', margin: 0 }}>
                    Ledger ({filteredEntries.length})
                  </h4>
                </div>
                <DataTable
                  className={`${styles.styled_table} ${styles.table_responsive}`}
                  columns={[
                    {
                      key: "date",
                      label: "DATE",
                      render: (val) => <span style={{ color: '#8C949B', whiteSpace: 'nowrap' }}>{formatDate(val)}</span>,
                    },
                    {
                      key: "description",
                      label: "DESCRIPTION",
                      render: (val) =>
                        val ? (
                          <span
                            title={val}
                            style={{
                              cursor: val.length > 50 ? "pointer" : "normal",
                            }}
                          >
                            {val.slice(0, 50) + (val.length > 50 ? "..." : "")}
                          </span>
                        ) : (
                          "-"
                        ),
                    },
                    {
                      key: "credit",
                      label: "CREDIT (₦)",
                      render: (val) => Number(val) ? <span style={{ fontWeight: 600, color: '#16A34A' }}>{formatCurrency(val)}</span> : '',
                    },
                    {
                      key: "debit",
                      label: "DEBIT (₦)",
                      render: (val) => Number(val) ? <span style={{ fontWeight: 600, color: '#DC2626' }}>{formatCurrency(val)}</span> : '',
                    },
                    {
                      key: "balance",
                      label: "BALANCE (₦)",
                      render: (val) => {
                        if (val == null) return '-';
                        const bal = Number(val);
                        const color = bal < 0 ? '#DC2626' : bal > 0 ? '#16A34A' : '#6B7280';
                        return <span style={{ fontWeight: 600, color }}>{formatCurrency(bal)}</span>;
                      },
                    },
                  ]}
                  data={displayedEntries}
                />
              </div>
            )}
            </div>
            {filteredEntries.length > 0 && !loading && !error && (
              <Pagination
                currentPage={currentPage}
                pageCount={Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage))}
                totalItems={filteredEntries.length}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                itemName="records"
              />
            )}
          </main>
        </section>
      </div>

      {/* Add Cash Modal */}
      <Modal show={showAddCashModal} onHide={() => setShowAddCashModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Cash To Drawer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form onSubmit={handleAddCash}>
            <Form.Group className="mb-3">
              <Form.Label>Amount to Add (₦)</Form.Label>
              <Form.Control
                type="text"
                value={addCashAmount}
                onChange={(e) => handleAmountChange(e, setAddCashAmount)}
                placeholder="Enter amount"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={addCashDescription}
                onChange={(e) => setAddCashDescription(e.target.value)}
                placeholder="Enter description"
                required
              />
            </Form.Group>
            <div className="text-end">
              <Button
                className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-3 fw-semibold ${styles.submit}`}
                type="submit"
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Processing...
                  </>
                ) : (
                  "Add Cash"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Withdraw Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Make a Withdrawal</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-0">
          <Form onSubmit={handleWithdraw}>
            <Form.Group className="mb-3">
              <Form.Label>Amount to Withdraw (₦)</Form.Label>
              <Form.Control
                type="text"
                value={withdrawAmount}
                onChange={(e) => handleAmountChange(e, setWithdrawAmount)}
                placeholder="Enter amount"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
                placeholder="Enter withdrawal description"
                required
              />
            </Form.Group>
            <div className="text-end">
              <Button
                className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-3 fw-semibold ${styles.submit}`}
                type="submit"
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3" />
    </section>
  );
};

export default CashDrawer;
