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
import ReactPaginate from "react-paginate";
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import DataTable from "../../shared/data-table/DataTable";

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
  const resolvedSiteId = activeSite?.id || user?.siteId;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { siteId: isSuperAdmin ? (activeSite?.id || "all") : (user?.siteId || "all") };
      if (typeFilter !== "all") params.type = typeFilter;
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
  }, [typeFilter, dateFrom, dateTo, isSuperAdmin, resolvedSiteId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
      const res = await Api.post("/add-cash-to-drawer", {
        amount,
        description: addCashDescription,
        siteId: resolvedSiteId,
        isWithdrawal: false,
      });
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
      const res = await Api.post("/add-cash-to-drawer", {
        amount,
        description: withdrawDescription,
        siteId: resolvedSiteId,
        isWithdrawal: true,
      });
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

  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(0);
  };

  const handlePageChange = ({ selected }) => setCurrentPage(selected);

  const resetFilters = () => {
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0);
  };

  const displayedEntries = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return entries.slice(start, start + itemsPerPage);
  }, [entries, currentPage]);

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
          <main className={`${styles.create_form}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 mb-3 gap-3 align-items-md-center">
              <h4 className="mb-3 mb-md-0">Cash Drawer</h4>
              <div className="d-flex flex-column justify-content-end align-items-center flex-md-row gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(0); }}
                  className="form-control"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(0); }}
                  className="form-control"
                  placeholder="End Date"
                />
                <Button
                  className={`border-0 btn-dark shadow py-2 px-3 fs-6 fw-semibold ${styles.submit}`}
                  onClick={() => setShowAddCashModal(true)}
                  style={{ minWidth: '160px', padding: '10px 24px' }}
                >
                  Add Cash
                </Button>
                <Button
                  className={`border-0 btn-dark shadow py-2 px-3 fs-6 fw-semibold ${styles.submit}`}
                  onClick={() => setShowWithdrawModal(true)}
                  style={{ minWidth: '160px', padding: '10px 24px' }}
                >
                  Withdraw
                </Button>
              </div>
            </div>

            <div className="d-flex gap-4 mb-4 flex-wrap align-items-center">
              {[
                { key: "all", label: "All" },
                { key: "deposit", label: "Deposits" },
                { key: "withdrawal", label: "Withdrawals" },
              ].map(({ key, label }) => (
                <h5
                  key={key}
                  className={`fs-6 ${typeFilter === key ? styles.activeView : ""}`}
                  onClick={() => handleTypeFilterChange(key)}
                  style={{ cursor: "pointer" }}
                >
                  {label}
                </h5>
              ))}
              {(dateFrom || dateTo) && (
                <span
                  className="text-muted"
                  style={{ cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={resetFilters}
                >
                  Clear filters
                </span>
              )}
            </div>

            {loading && <SkeletonTable cols={6} rows={5} />}

            {!loading && error && <ErrorState message={error} />}

            {!loading && !error && entries.length === 0 && (
              <EmptyState
                title={dateFrom || dateTo || typeFilter !== "all" ? "No matches found" : "No cash drawer entries found"}
                description={dateFrom || dateTo || typeFilter !== "all" ? "Try adjusting your filters." : "Add cash to get started."}
              />
            )}

            {!loading && !error && entries.length > 0 && (
              <DataTable
                className={`${styles.styled_table} ${styles.table_responsive}`}
                columns={[
                  {
                    key: "date",
                    label: "DATE",
                    render: (val) => formatDate(val),
                  },
                  {
                    key: "isWithdrawal",
                    label: "TYPE",
                    render: (val) => (
                      <span
                        className={`badge ${val ? "bg-danger" : "bg-success"}`}
                      >
                        {val ? "Withdrawal" : "Deposit"}
                      </span>
                    ),
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
                    render: (val, row) =>
                      row?.isWithdrawal || !val ? (
                        "-"
                      ) : (
                        <span style={{ color: "green" }}>
                          ₦{val.toLocaleString()}
                        </span>
                      ),
                  },
                  {
                    key: "debit",
                    label: "DEBIT (₦)",
                    render: (val, row) =>
                      !row?.isWithdrawal || !val ? (
                        "-"
                      ) : (
                        <span style={{ color: "red" }}>
                          ₦{val.toLocaleString()}
                        </span>
                      ),
                  },
                  {
                    key: "balance",
                    label: "BALANCE (₦)",
                    render: (val) =>
                      val != null ? `₦${val.toLocaleString()}` : "-",
                  },
                ]}
                data={displayedEntries}
              />
            )}
            </div>
            {!loading && !error && entries.length > 0 && (
              <div className="d-flex justify-content-center" style={{ padding: '12px 0', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                <ReactPaginate
                  previousLabel={"< "}
                  nextLabel={" >"}
                  breakLabel={"..."}
                  pageCount={Math.max(1, Math.ceil(entries.length / itemsPerPage))}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageChange}
                  forcePage={currentPage}
                  containerClassName={"pagination"}
                  pageClassName={"page-item"}
                  pageLinkClassName={"page-link"}
                  previousClassName={"page-item"}
                  previousLinkClassName={"page-link"}
                  nextClassName={"page-item"}
                  nextLinkClassName={"page-link"}
                  breakClassName={"page-item"}
                  breakLinkClassName={"page-link"}
                  activeClassName={"active"}
                />
              </div>
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
