import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsExclamationTriangleFill, BsPrinter } from "react-icons/bs";
import { FaArrowLeft } from "react-icons/fa";
import { Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
import { SkeletonTable } from "../../shared/skeleton/Skeleton";
import ReceiptModal from "../../finance/add-sales/receipt";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PersonalLedger = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const itemsPerPage = 10;
  const [balance, setBalance] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [pendingSales, setPendingSales] = useState([]);
  const [pendingSalesLoading, setPendingSalesLoading] = useState(false);
  const [pendingSalesError, setPendingSalesError] = useState('');
  const [selectedPendingSale, setSelectedPendingSale] = useState(""); // Holds salesId
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
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/customer/view-all");
  };

  useEffect(() => {
    if (id) {
      fetchLedgerData();
    }
  }, [id]);

  const fetchLedgerData = async () => {
    try {
      const response = await Api.get(`/customer/${id}`);
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
      const response = await Api.get(`/customer/${id}/pending-sales`);
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
    const date = new Date(isoDate);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(0);
  };

  const filteredLedgerData = React.useMemo(() => {
    if (!selectedDate) {
      return ledgerData;
    }
    return ledgerData.filter(record => formatDate(record.date) === selectedDate);
  }, [ledgerData, selectedDate]);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const startIndex = currentPage * itemsPerPage;
  const displayedLedgerData = React.useMemo(() => {
    return filteredLedgerData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLedgerData, currentPage, itemsPerPage]);

  useEffect(() => {
    if (displayedLedgerData.length > 0) {
      setBalance(displayedLedgerData[0].balanceWithRollover);
    }
  }, [displayedLedgerData]);

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
    setSelectedPendingSale(sale.id || ""); // Use salesId
    setTransactionId(sale.transactionId || "");
    setTotalAmount(sale.totalPrice - sale.totalPaid - (sale.discount || 0));
    setAmountPaidB(sale.totalPaid || 0);
    setSalesType(sale.paymentType || ""); // Set payment type from pending
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
      toast.error("Please enter an amount to pay.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (!salesType) {
      toast.error("Please select a payment type.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const loadingToastId = toast.loading("Processing payment...", {
      position: "top-center",
    });
    setLoadingPayment(true);

    try {
      const paymentData = {
        customerId: id,
        salesId: selectedPendingSale || null, // Send salesId, allow null if no pending sale selected
        amountPaid: parseFloat(amountPaid),
        paymentType: salesType,
        description: description || "",
      };

      const response = await Api.post("/add-payment", paymentData);
      toast.update(loadingToastId, {
        render: "Payment added successfully!",
        type: "success",
        isLoading: false,
        position: "top-center",
        autoClose: 3000,
      });

      setShowModal(false);
      resetForm();
      fetchLedgerData();
      fetchPendingSales();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.update(loadingToastId, {
        render: error.response?.data?.response_message || "Failed to add payment. Please try again.",
        type: "error",
        isLoading: false,
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleReceipt = async (record) => {
    const receiptToast = toast.loading("Fetching receipt...", { className: 'dark-toast' });
    try {
      const receiptResponse = await Api.get(`/sales-receipts/${record.transactionId}`);
      if (receiptResponse.status === 404) {
        throw new Error(receiptResponse.data.message || "Receipt not found.");
      }
      if (receiptResponse.status < 200 || receiptResponse.status >= 300) {
        throw new Error("Receipt could not be fetched.");
      }
      setReceiptData(receiptResponse);
      toast.update(receiptToast, {
        render: "Receipt fetched successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
      setShowReceipt(true);
    } catch (error) {
      toast.update(receiptToast, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        className: 'dark-toast'
      });
    }
  };

  const pageCount = Math.ceil(filteredLedgerData.length / itemsPerPage);

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const handleCloseSidebar = () => setShowSidebar(false);

  return (
    <section className={`${styles.body}`}>
      <div className="sticky-top">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      <div className="d-flex gap-2">
        <div className={`${styles.sidebar} ${showSidebar ? 'd-none' : 'd-block'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="mt-3 mb-2 d-flex justify-content-between">
              <div>
                <h4>{fullName?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</h4>
                <p className="fw-light">Category: {category}</p>
              </div>
              <div>
                <button
                  onClick={handleBack}
                  className={`border-1 btn btn-light shadow-sm py-2 px-3 fs-6 fw-semibold`}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <FaArrowLeft size={16} />
                  Back
                </button>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-between">
              <div className="w-50 mb-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
              </div>
              <div>
                <Button
                  onClick={handleAddMoney}
                  className={`border-0 btn-dark shadow py-2 px-5 fs-6 mb-5 fw-semibold ${styles.submit}`}
                >
                  Add Payment
                </Button>
              </div>
            </div>

            {loading && <SkeletonTable cols={6} rows={5} />}

            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredLedgerData.length > 0 && (
              <>
                <div  className='table-responsive'>
                  <table className={`table ${styles.styled_tables}`}>
                    <thead className={`rounded-2 ${styles.theaders}`}>
                      <tr>
                        <th>DATE</th>
                        <th>DESCRIPTION</th>
                        <th>PAYMENT</th>
                        <th style={{ color: 'green' }}>CREDIT(₦)</th>
                        <th style={{ color: 'red' }}>DEBIT(₦)</th>
                        <th>BALANCE(₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedLedgerData.map((record) => (
                        <tr key={record.id} className="text-start">
                          <td>{formatDate(record.date)}</td>
                          <td>{record.productName || record.description}</td>
                          <td>{record.paymentType}</td>
                          <td style={{ color: 'green' }}>{record.credit ? record.credit.toLocaleString() : '-'}</td>
                          <td style={{ color: 'red' }}>{record.debit ? record.debit.toLocaleString() : '-'}</td>
                          <td>
                            <div className="d-flex gap-3 align-items-center">
                              <span>{record.balance.toLocaleString()}</span>
                              {record.productName && (<span className="bg-white p-2 rounded-circle badge">
                                <BsPrinter
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleReceipt(record)}
                                  className="text-primary"
                                  size={28}
                                />
                              </span>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-center mt-4">
                  <ReactPaginate
                    previousLabel={"< "}
                    nextLabel={" >"}
                    breakLabel={"..."}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageChange}
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
            {!loading && !error && filteredLedgerData.length < 1 && (
              <Alert variant="info" className="text-center w-100 py-5">
                <p className="text-center fw-semibold">No Ledger found</p>
              </Alert>
            )}
          </main>
        </section>
      </div>

      {/* Modal for Adding Payment */}
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
            <>
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
            </>
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

      <ToastContainer />
      <ReceiptModal receiptData={receiptData} onClose={() => setShowReceipt(false)} show={showReceipt} />
    </section>
  );
};

export default PersonalLedger;