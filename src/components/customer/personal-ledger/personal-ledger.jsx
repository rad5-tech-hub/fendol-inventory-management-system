import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../../shared/sidebar/sidebar";
import Header from "../../shared/header/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../customer.module.scss';
import { BsExclamationTriangleFill, BsPrinter } from "react-icons/bs";
import { FaArrowLeft } from "react-icons/fa"; // Import back arrow icon
import { Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
import Api from "../../shared/api/apiLink";
import ReactPaginate from 'react-paginate';
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
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar toggle state
  const itemsPerPage = 5;
  const [balance, setBalance] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [receiptData, setReceiptData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [amountPaidB, setAmountPaidB] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
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
        } else {
          console.log("No data available");
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

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD format
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(0); // Reset page when date changes
  };

  const filteredLedgerData = React.useMemo(() => {
    if (!selectedDate) {
      return ledgerData;
    }
    return ledgerData.filter(record => {
      const recordDate = formatDate(record.date);
      return recordDate === selectedDate;
    });
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

  const handleEditAmount = (record) => {
    setEditingRecord(record.id);
    setAmountPaidB(record.debit - Math.abs(record.balance) || "");
    setTransactionId(record.salesId || "");
    setTotalAmount(Math.abs(record.balance) || ""); // Set total amount due
    setShowModal(true);
  };

  const handleAmountChange = (e) => {
    setAmountPaid(e.target.value);
  };

  const handleSubmitAmountPaid = async () => {
    const loadingToastId = toast.loading("Updating payment...", { position: "top-center" });
    try {
      const response = await Api.put(`/update-payment/${transactionId}`, {
        amountPaid,
      });
      if (response.status === 200) {
        toast.update(loadingToastId, {
          render: "Payment updated successfully!",
          type: "success",
          isLoading: false,
          position: "top-center",
          autoClose: 3000,
        });
        setEditingRecord(null);
        setAmountPaid("");
        setShowModal(false);
        fetchLedgerData();
      }
    } catch (error) {
      console.error("Error updating payment", error);
      toast.update(loadingToastId, {
        render: "Failed to update payment",
        type: "error",
        isLoading: false,
        position: "top-center",
        autoClose: 3000,
      });
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
        <div className={`${styles.sidebar} d-lg-block ${showSidebar ? 'd-block' : 'd-none'}`}>
          <SideBar className={styles.sidebarItem} show={showSidebar} handleClose={handleCloseSidebar} />
        </div>

        <section className={styles.content}>
          <main className={styles.create_form}>
            <div className="mt-3 mb-5 d-flex justify-content-between">
              <div>
                <h4>{fullName?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</h4>
                <p className="fw-light">Category: {category}</p>
              </div>
              <div>
                <button
                  onClick={handleBack}
                  className={`border-1  btn btn-light shadow-sm py-2 px-3 fs-6 fw-semibold`} // Consistent styling
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} // Flex for icon and text alignment
                >
                  <FaArrowLeft size={16} /> {/* Back icon */}
                  Back
                </button>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <div className="w-25 mb-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="form-control"
                  placeholder="Filter By Date"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            {error && (
              <div className="d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-50 py-5">
                  <BsExclamationTriangleFill size={40} /> <span className="fw-semibold">{error}</span>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredLedgerData.length > 0 && (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.styled_tables}>
                    <thead className={`rounded-2 ${styles.theaders}`}>
                      <tr>
                        <th>DATE</th>
                        <th>PRODUCT</th>
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
                          <td>{record.productName}</td>
                          <td>{record.paymentType}</td>
                          <td style={{ color: 'green' }}>{record.credit ? record.credit.toLocaleString() : '-'}</td>
                          <td style={{ color: 'red' }}>{record.debit ? record.debit.toLocaleString() : '-'}</td>
                          <td>
                            <div className="d-flex gap-3 align-items-center">
                              <span>{record.balance.toLocaleString()}</span>
                              <p
                                className={`badge p-2 mt-3 ${record.debit === 0 ? 'bg-success' : 'bg-danger'}`}
                                style={{ cursor: record.debit !== 0 ? 'pointer' : 'default' }}
                                onClick={record.debit !== 0 ? () => handleEditAmount(record) : null}
                              >
                                {record.debit === 0 ? 'Paid' : 'Credit'}
                              </p>
                              <span className="bg-white p-2 rounded-circle badge">
                                <BsPrinter
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleReceipt(record)}
                                  className="text-primary"
                                  size={28}
                                />
                              </span>
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
          </main>
        </section>
      </div>

      {/* Modal for Editing Payment */}
      <Modal show={showModal} size="sm" onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pay Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>   
          <p><strong>Amount Paid Before:</strong> ₦{(amountPaidB).toLocaleString()}</p> 
          <p><strong>Balance:</strong> <span className="ps-1">{totalAmount} - {amountPaid || 0} </span> = ₦{(totalAmount - amountPaid).toLocaleString()}</p>
          <Form.Control
            type="number"
            value={amountPaid}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="mb-2"
          />
          <div className="text-end">
            <Button variant="primary" className="px-4" onClick={handleSubmitAmountPaid}>
              PAY
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