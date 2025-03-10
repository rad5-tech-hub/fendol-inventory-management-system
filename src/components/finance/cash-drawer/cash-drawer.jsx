import React, { useState, useEffect } from "react";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../finance.module.scss";
import { BsExclamationTriangleFill } from "react-icons/bs";
import { Spinner, Alert, Modal, Button, Form, Toast, ToastContainer } from "react-bootstrap";
import Api from "../../shared/api/apiLink";
import ReactPaginate from "react-paginate";

const CashDrawer = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [withdrawalData, setWithdrawalData] = useState([]);
  const [cashLoading, setCashLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [cashError, setCashError] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [cashPage, setCashPage] = useState(0);
  const [withdrawPage, setWithdrawPage] = useState(0);
  const [viewMode, setViewMode] = useState("cash"); // "cash" or "withdrawals"
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const [modalLoading, setModalLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState("");

  // Fetch Cash Drawer Data
  const fetchCashDrawerData = async () => {
    setCashLoading(true);
    setCashError("");
    try {
      const response = await Api.get("/cash");
      if (Array.isArray(response.data.data)) {
        setLedgerData(response.data.data);
      } else {
        throw new Error("Expected an array of cash drawer data");
      }
    } catch (err) {
      setCashError(err.response?.data?.message || "Failed to fetch cash drawer data.");
    } finally {
      setCashLoading(false);
    }
  };

  // Fetch Withdrawal Data
  const fetchWithdrawalData = async () => {
    setWithdrawLoading(true);
    setWithdrawError("");
    try {
      const response = await Api.get("/withdrawals");
      if (response.data.success && Array.isArray(response.data.withdrawals)) {
        setWithdrawalData(response.data.withdrawals);
      } else {
        throw new Error("Expected an array of withdrawal data");
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Failed to fetch withdrawal data.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Format Number with Commas
  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle Withdraw Submission
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const withdrawData = {
        amountWithdraw: parseFloat(withdrawAmount.replace(/,/g, "")),
        description: withdrawDescription,
      };
      const response = await Api.post("/withdraw", withdrawData);
      setWithdrawalData([response.data.data, ...withdrawalData]);
      setToast({ show: true, message: "Withdrawal successful!", variant: "success" });
      setShowModal(false);
      setWithdrawAmount("");
      setWithdrawDescription("");
      if (viewMode === "withdrawals") fetchWithdrawalData();
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Withdrawal failed!", variant: "danger" });
    } finally {
      setModalLoading(false);
    }
  };

  // Format Date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Handle Date Filter
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCashPage(0);
    setWithdrawPage(0);
  };

  // Filter Data
  const filterData = (data, dateField) =>
    selectedDate ? data.filter((record) => formatDate(record[dateField]) === selectedDate) : data;

  const filteredCashData = filterData(ledgerData, "date");
  const filteredWithdrawData = filterData(withdrawalData, "WithdrawalDate");

  const displayedCashData = filteredCashData.slice(cashPage * itemsPerPage, (cashPage + 1) * itemsPerPage);
  const displayedWithdrawData = filteredWithdrawData.slice(withdrawPage * itemsPerPage, (withdrawPage + 1) * itemsPerPage);

  // Pagination Handlers
  const handleCashPageChange = ({ selected }) => setCashPage(selected);
  const handleWithdrawPageChange = ({ selected }) => setWithdrawPage(selected);

  // Switch Views
  const handleViewChange = (mode) => {
    setViewMode(mode);
    setSelectedDate("");
    mode === "cash" ? fetchCashDrawerData() : fetchWithdrawalData();
  };

  // Handle Amount Input with Commas
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, "");
    if (!isNaN(value) && value !== "") {
      setWithdrawAmount(formatNumberWithCommas(value));
    } else {
      setWithdrawAmount("");
    }
  };

  // Sidebar Toggle Handlers
  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  useEffect(() => {
    fetchCashDrawerData(); // Initial fetch
  }, []);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={styles.sidebar}>
          <SideBar show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={`${styles.content}`}>
          <main className={`${styles.create_form}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between mt-3 mb-5 align-items-md-center">
              <h4 className="mb-3 mb-md-0">Cash Drawer</h4>
              <div className="d-flex flex-column flex-md-row gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
                <Button
                  className={`border-0 btn-dark shadow py-2 px-4 fs-6 fw-semibold ${styles.submit}`}
                  onClick={() => setShowModal(true)}
                >
                  Withdraw
                </Button>
              </div>
            </div>

            <div className="d-flex gap-5 mb-4 flex-wrap">
              <h5
                className={`fs-6 ${viewMode === "cash" ? styles.activeView : ""}`}
                onClick={() => handleViewChange("cash")}
                style={{ cursor: "pointer" }}
              >
                View Cash Drawer
              </h5>
              <h5
                className={`fs-6 ${viewMode === "withdrawals" ? styles.activeView : ""}`}
                onClick={() => handleViewChange("withdrawals")}
                style={{ cursor: "pointer" }}
              >
                View Withdrawals
              </h5>
            </div>

            {/* Cash Drawer View */}
            {viewMode === "cash" && (
              <>
                {cashLoading && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading Cash Drawer...</span>
                    </Spinner>
                  </div>
                )}
                {!cashLoading && cashError && (
                  <Alert variant="danger" className="text-center w-75 py-5 mx-auto">
                    <BsExclamationTriangleFill size={40} />{" "}
                    <span className="fw-semibold">{cashError}</span>
                  </Alert>
                )}
                {!cashLoading && !cashError && displayedCashData.length === 0 && (
                  <Alert variant="info" className="text-center w-75 py-5 mx-auto">
                    No available cash drawer data
                  </Alert>
                )}
                {!cashLoading && !cashError && displayedCashData.length > 0 && (
                  <>
                    <table className={`${styles.styled_table} ${styles.table_responsive}`}>
                      <thead className={`rounded-2 ${styles.theader}`}>
                        <tr>
                          <th>DATE</th>
                          <th className="pt-3">DESCRIPTION</th>
                          <th style={{ color: "green" }} className="pt-3">
                            CREDIT(₦)
                          </th>
                          <th style={{ color: "red" }} className="pt-3">
                            DEBIT(₦)
                          </th>
                          <th>BALANCE(₦)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedCashData.map((record, index) => (
                          <tr key={index}>
                            <td>{formatDate(record.date)}</td>
                            <td
                              title={record.description}
                              style={{ cursor: record.description?.length > 50 ? "pointer" : "normal" }}
                            >
                              {record.description?.slice(0, 50) + (record.description?.length > 50 ? "..." : "") || ""}
                            </td>
                            <td style={{ color: "green" }}>
                              {record.credit ? `₦${record.credit.toLocaleString()}` : "-"}
                            </td>
                            <td style={{ color: "red" }}>
                              {record.debit ? `₦${record.debit.toLocaleString()}` : "-"}
                            </td>
                            <td>{`₦${record.balance.toLocaleString()}`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-center mt-4">
                      <ReactPaginate
                        previousLabel={"< "}
                        nextLabel={" >"}
                        breakLabel={"..."}
                        pageCount={Math.ceil(filteredCashData.length / itemsPerPage)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handleCashPageChange}
                        containerClassName={"pagination"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        previousLinkClassName={"page-link"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        breakLinkClassName={"page-link"}
                        activeClassName={"dark"}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Withdrawals View */}
            {viewMode === "withdrawals" && (
              <>
                {withdrawLoading && (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading Withdrawals...</span>
                    </Spinner>
                  </div>
                )}
                {!withdrawLoading && withdrawError && (
                  <Alert variant="danger" className="text-center w-75 py-5 mx-auto">
                    <BsExclamationTriangleFill size={40} />{" "}
                    <span className="fw-semibold">{withdrawError}</span>
                  </Alert>
                )}
                {!withdrawLoading && !withdrawError && displayedWithdrawData.length === 0 && (
                  <Alert variant="info" className="text-center w-75 py-5 mx-auto">
                    No available withdrawal data
                  </Alert>
                )}
                {!withdrawLoading && !withdrawError && displayedWithdrawData.length > 0 && (
                  <>
                    <table className={`${styles.styled_table} table-responsive`}>
                      <thead className={`rounded-2 ${styles.theader}`}>
                        <tr>
                          <th>DATE</th>
                          <th className="pt-3">DESCRIPTION</th>
                          <th style={{ color: "red" }} className="pt-3">
                            AMOUNT(₦)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedWithdrawData.map((record, index) => (
                          <tr key={index}>
                            <td>{formatDate(record.WithdrawalDate)}</td>
                            <td
                              title={record.description}
                              style={{ cursor: record.description?.length > 50 ? "pointer" : "normal" }}
                            >
                              {record.description?.slice(0, 50) + (record.description?.length > 50 ? "..." : "") || ""}
                            </td>
                            <td style={{ color: "red" }}>
                              {record.amountWithdraw ? `₦${record.amountWithdraw.toLocaleString()}` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-center mt-4">
                      <ReactPaginate
                        previousLabel={"< "}
                        nextLabel={" >"}
                        breakLabel={"..."}
                        pageCount={Math.ceil(filteredWithdrawData.length / itemsPerPage)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handleWithdrawPageChange}
                        containerClassName={"pagination"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        previousClassName={"page-item"}
                        previousLinkClassName={"page-link"}
                        nextClassName={"page-item"}
                        nextLinkClassName={"page-link"}
                        breakClassName={"page-item"}
                        breakLinkClassName={"page-link"}
                        activeClassName={"dark"}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </section>
      </div>

      {/* Withdraw Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
                onChange={handleAmountChange}
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3000}
          autohide
          bg={toast.variant === "success" ? "success" : "danger"}
          style={{ backgroundColor: "white", color: "black" }}
        >
          <Toast.Header>
            <strong className="me-auto">{toast.variant === "success" ? "Success" : "Error"}</strong>
          </Toast.Header>
          <Toast.Body>{toast.message}</Toast.Body>
          <div
            className="toast-progress"
            style={{ height: "5px", backgroundColor: toast.variant === "success" ? "#28a745" : "#dc3545" }}
          ></div>
        </Toast>
      </ToastContainer>
    </section>
  );
};

export default CashDrawer;